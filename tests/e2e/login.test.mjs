// E2E: kiểm thử đầu vào của POST /auth/login (validation + xác thực) và token sau đăng nhập.
// Chạy (cần API + DB đã chạy và đã seed):  node --test tests/e2e/login.test.mjs
// Đổi địa chỉ API:  API_URL=http://localhost:4000 node --test tests/e2e/login.test.mjs
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const API = process.env.API_URL ?? 'http://localhost:4000';

// Tài khoản có sẵn trong apps/api/prisma/seed.ts
const DEMO = { email: 'demo@brewlite.vn', password: 'Demo1234' };
const STAFF = { email: 'staff@brewlite.vn', password: 'Staff1234' };
const BAD_CREDENTIALS = 'Email hoặc mật khẩu không đúng';

async function login(body, { raw = false } = {}) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const messages = (r) => [].concat(r.data?.message ?? []);

// ---------------------------------------------------------------------------
// 1. Đăng nhập thành công
// ---------------------------------------------------------------------------
describe('Đăng nhập thành công (200)', () => {
  it('đúng email + mật khẩu', async () => {
    const r = await login(DEMO);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.ok(r.data.accessToken, 'thiếu accessToken');
    assert.equal(r.data.user.email, DEMO.email);
    assert.equal(r.data.user.role, 'CUSTOMER');
  });

  it('không lộ passwordHash trong phản hồi', async () => {
    const r = await login(DEMO);
    assert.equal(r.status, 200);
    assert.ok(!JSON.stringify(r.data).includes('passwordHash'));
    assert.ok(!('passwordHash' in r.data.user));
  });

  it('email viết hoa vẫn đăng nhập được (chuẩn hóa chữ thường)', async () => {
    const r = await login({ email: 'DEMO@BrewLite.VN', password: DEMO.password });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.user.email, DEMO.email);
  });

  it('email thừa khoảng trắng hai đầu vẫn đăng nhập được (trim)', async () => {
    const r = await login({ email: `  ${DEMO.email}  `, password: DEMO.password });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  });

  it('tài khoản nhân viên có role STAFF', async () => {
    const r = await login(STAFF);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.user.role, 'STAFF');
  });
});

// ---------------------------------------------------------------------------
// 2. Đầu vào hợp lệ về định dạng nhưng sai thông tin -> 401
// ---------------------------------------------------------------------------
const SAI_THONG_TIN = [
  ['sai mật khẩu', { email: DEMO.email, password: 'Sai12345' }],
  ['email chưa đăng ký', { email: 'khongtontai@brewlite.vn', password: DEMO.password }],
  ['mật khẩu sai chữ hoa/thường', { email: DEMO.email, password: 'demo1234' }],
  ['mật khẩu thừa khoảng trắng ở cuối', { email: DEMO.email, password: `${DEMO.password} ` }],
  ['mật khẩu chỉ gồm khoảng trắng', { email: DEMO.email, password: '   ' }],
  ['mật khẩu dài đúng 72 ký tự (biên trên)', { email: DEMO.email, password: 'a'.repeat(72) }],
  ['mật khẩu là chuỗi SQL injection', { email: DEMO.email, password: "' OR '1'='1" }],
  ['mật khẩu của tài khoản khác', { email: DEMO.email, password: STAFF.password }],
];

describe('Sai thông tin đăng nhập (401)', () => {
  for (const [name, body] of SAI_THONG_TIN) {
    it(name, async () => {
      const r = await login(body);
      assert.equal(r.status, 401, JSON.stringify(r.data));
      assert.equal(r.data.message, BAD_CREDENTIALS);
      assert.ok(!r.data.accessToken, 'không được cấp token');
    });
  }

  it('sai mật khẩu và email chưa đăng ký trả cùng thông báo (không lộ email nào tồn tại)', async () => {
    const a = await login({ email: DEMO.email, password: 'Sai12345' });
    const b = await login({ email: 'khongtontai@brewlite.vn', password: 'Sai12345' });
    assert.equal(a.status, b.status);
    assert.equal(a.data.message, b.data.message);
  });
});

// ---------------------------------------------------------------------------
// 3. Đầu vào sai định dạng -> 400
// ---------------------------------------------------------------------------
const DAU_VAO_SAI = [
  // thiếu trường
  ['body rỗng', {}],
  ['thiếu email', { password: DEMO.password }],
  ['thiếu password', { email: DEMO.email }],
  // email sai định dạng
  ['email rỗng', { email: '', password: DEMO.password }],
  ['email chỉ có khoảng trắng', { email: '   ', password: DEMO.password }],
  ['email thiếu @', { email: 'demo.brewlite.vn', password: DEMO.password }],
  ['email thiếu phần tên (@brewlite.vn)', { email: '@brewlite.vn', password: DEMO.password }],
  ['email thiếu tên miền (demo@)', { email: 'demo@', password: DEMO.password }],
  ['email thiếu đuôi miền (demo@brewlite)', { email: 'demo@brewlite', password: DEMO.password }],
  ['email có khoảng trắng ở giữa', { email: 'de mo@brewlite.vn', password: DEMO.password }],
  ['email là chuỗi SQL injection', { email: "' OR '1'='1", password: DEMO.password }],
  ['email dài hơn 254 ký tự', { email: `${'a'.repeat(250)}@brewlite.vn`, password: DEMO.password }],
  // sai kiểu dữ liệu
  ['email là số', { email: 123, password: DEMO.password }],
  ['email là null', { email: null, password: DEMO.password }],
  ['email là mảng', { email: [DEMO.email], password: DEMO.password }],
  ['email là object ({ $ne: null })', { email: { $ne: null }, password: DEMO.password }],
  ['password là số', { email: DEMO.email, password: 12345678 }],
  ['password là null', { email: DEMO.email, password: null }],
  ['password là mảng', { email: DEMO.email, password: [DEMO.password] }],
  // password sai độ dài
  ['password rỗng', { email: DEMO.email, password: '' }],
  ['password dài 73 ký tự (vượt biên trên)', { email: DEMO.email, password: 'a'.repeat(73) }],
  // trường lạ
  ['thừa trường role (forbidNonWhitelisted)', { ...DEMO, role: 'ADMIN' }],
];

describe('Đầu vào không hợp lệ (400)', () => {
  for (const [name, body] of DAU_VAO_SAI) {
    it(name, async () => {
      const r = await login(body);
      assert.equal(r.status, 400, JSON.stringify(r.data));
      assert.ok(!r.data?.accessToken, 'không được cấp token');
    });
  }

  it('JSON bị hỏng', async () => {
    const r = await login('{"email": "demo@brewlite.vn", ', { raw: true });
    assert.equal(r.status, 400);
  });

  it('thông báo lỗi email: "Email không hợp lệ"', async () => {
    const r = await login({ email: 'abc', password: DEMO.password });
    assert.equal(r.status, 400);
    assert.ok(messages(r).includes('Email không hợp lệ'), JSON.stringify(r.data));
  });

  it('thông báo lỗi mật khẩu rỗng: "Vui lòng nhập mật khẩu"', async () => {
    const r = await login({ email: DEMO.email, password: '' });
    assert.equal(r.status, 400);
    assert.ok(messages(r).includes('Vui lòng nhập mật khẩu'), JSON.stringify(r.data));
  });

  it('thông báo trường lạ: role không được phép', async () => {
    const r = await login({ ...DEMO, role: 'ADMIN' });
    assert.equal(r.status, 400);
    assert.ok(messages(r).some((m) => m.includes('role')), JSON.stringify(r.data));
  });
});

// ---------------------------------------------------------------------------
// 4. Token sau đăng nhập
// ---------------------------------------------------------------------------
describe('Token sau đăng nhập', () => {
  it('GET /auth/me với token hợp lệ trả đúng người dùng', async () => {
    const s = await login(DEMO);
    assert.equal(s.status, 200);
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${s.data.accessToken}` },
    });
    const me = await res.json();
    assert.equal(res.status, 200, JSON.stringify(me));
    assert.equal(me.email, DEMO.email);
    assert.ok(!('passwordHash' in me));
  });

  it('GET /auth/me không có token -> 401', async () => {
    const res = await fetch(`${API}/auth/me`);
    assert.equal(res.status, 401);
  });

  it('GET /auth/me với token giả -> 401', async () => {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: 'Bearer abc.def.ghi' },
    });
    assert.equal(res.status, 401);
  });
});
