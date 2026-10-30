# tests/ – Integration / E2E

Unit test của backend nằm cạnh code (`apps/api/src/**/*.spec.ts`, chạy bằng `npm test` trong `apps/api`).
Thư mục này chứa test chạy trên hệ thống đang chạy thật.

## E2E smoke test

Luồng: đăng nhập -> xem sản phẩm -> tạo đơn -> thanh toán (kiểm tra idempotency) -> xem đơn.

```bash
docker compose up --build -d        # hoặc chạy API + DB thủ công
node tests/e2e/smoke.mjs            # cần Node 18+
# API ở địa chỉ khác:  API_URL=http://localhost:4000 node tests/e2e/smoke.mjs
```

## Test đầu vào đăng nhập

Kiểm tra `POST /auth/login` với nhiều ca đầu vào (đúng, sai thông tin, thiếu trường, sai định dạng, sai kiểu dữ liệu, trường lạ, JSON hỏng) và token sau đăng nhập. Cần API + DB đã chạy và đã seed.

```bash
node --test tests/e2e/login.test.mjs
```
