// E2E smoke test: đăng nhập -> xem sản phẩm -> tạo đơn -> thanh toán (idempotent) -> xem đơn.
// Chạy (cần API + DB đã chạy và đã seed):  node tests/e2e/smoke.mjs
// Đổi địa chỉ API:  API_URL=http://localhost:4000 node tests/e2e/smoke.mjs
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const API = process.env.API_URL ?? 'http://localhost:4000';
let token = '';

async function call(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function step(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exit(1);
  }
}

console.log(`E2E smoke test -> ${API}`);

await step('GET / (health)', async () => {
  const r = await call('/');
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'ok');
});

await step('POST /auth/login (demo@brewlite.vn)', async () => {
  const r = await call('/auth/login', {
    method: 'POST',
    body: { email: 'demo@brewlite.vn', password: 'Demo1234' },
  });
  assert.equal(r.status, 200, JSON.stringify(r.data)); // controller dùng @HttpCode(200) cho login
  token = r.data.token ?? r.data.accessToken;
  assert.ok(token, 'không có token trong phản hồi đăng nhập');
});

let productId;
await step('GET /products', async () => {
  const r = await call('/products');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data) && r.data.length > 0, 'danh sách sản phẩm rỗng');
  productId = r.data[0].id;
});

let orderId;
await step('POST /orders', async () => {
  const r = await call('/orders', {
    method: 'POST',
    body: { items: [{ productId, size: 'S', qty: 1 }] },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  orderId = r.data.id;
  assert.ok(orderId, 'đơn hàng không có id');
});

const key = randomUUID();
let firstPayment;
await step('POST /payments', async () => {
  const r = await call('/payments', {
    method: 'POST',
    body: { orderId, method: 'WALLET' },
    headers: { 'Idempotency-Key': key },
  });
  assert.ok([200, 201].includes(r.status), JSON.stringify(r.data));
  assert.equal(r.data.replayed, false, 'lần gọi đầu không được là replay');
  firstPayment = r.data;
});

await step('POST /payments lặp cùng Idempotency-Key không trừ tiền lần 2', async () => {
  const r = await call('/payments', {
    method: 'POST',
    body: { orderId, method: 'WALLET' },
    headers: { 'Idempotency-Key': key },
  });
  assert.ok([200, 201].includes(r.status), JSON.stringify(r.data));
  // API cố ý trả replayed:true ở lần gọi lại, nên tách riêng trường này ra
  // rồi mới so sánh phần còn lại (payment, order) phải giống hệt lần đầu.
  const { replayed: firstReplayed, ...first } = firstPayment;
  const { replayed: secondReplayed, ...second } = r.data;
  assert.equal(firstReplayed, false);
  assert.equal(secondReplayed, true, 'lần gọi lại phải được đánh dấu replayed:true');
  assert.deepEqual(second, first, 'kết quả khác lần gọi đầu');
});

await step('GET /orders/:id (đã thanh toán)', async () => {
  const r = await call(`/orders/${orderId}`);
  assert.equal(r.status, 200);
  assert.notEqual(r.data.status, 'PENDING');
});

console.log('Tất cả bước đều đạt.');
