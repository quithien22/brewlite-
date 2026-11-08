# BrewLite – Backend (NestJS)

REST API cho ứng dụng đặt cà phê không dùng tiền mặt. Công nghệ: **NestJS + Prisma + PostgreSQL**, xác thực **JWT (Passport)**, validate bằng **class-validator**.

## Chạy nhanh

```bash
cd apps/api
cp .env.example .env          # chỉnh DATABASE_URL / JWT_SECRET nếu cần
npm install
npx prisma generate
npx prisma migrate deploy     # tạo bảng bằng migration
npm run seed                  # nạp menu, topping, khuyến mãi, tài khoản demo
npm run start:dev             # http://localhost:4000
```

Cần một PostgreSQL đang chạy (cách nhanh nhất: `docker compose up -d db` ở thư mục gốc).

Kiểm tra: `GET http://localhost:4000/health` → `{ "status": "ok", "database": "up", ... }` (503 khi mất kết nối database).

## Tài khoản demo (do `npm run seed` tạo)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng (120 điểm) | `demo@brewlite.vn` | `Demo1234` |

MVP chỉ có vai trò khách hàng. Mã khuyến mãi mẫu: `CHAO10`, `GIAM15K`, `COMBO20`.

## Endpoint

| Method | Đường dẫn | Mô tả | Auth |
|---|---|---|---|
| GET | `/health` | Health check, 200 khi app và database sống, 503 khi mất kết nối database | – |
| GET | `/products` | Danh sách menu (`?category=&search=&featured=`) | – |
| GET | `/products/:id` | Chi tiết + tùy chọn size/topping/đường/đá | – |
| POST | `/auth/register` | Đăng ký (bcrypt, trả JWT) | – |
| POST | `/auth/login` | Đăng nhập, trả JWT | – |
| POST | `/auth/forgot-password` | Quên mật khẩu (mô phỏng gửi mail, ngoài phạm vi MVP) | – |
| GET | `/auth/me` | Thông tin user + điểm thưởng | JWT |
| GET | `/promotions` | Khuyến mãi đang chạy | – |
| POST | `/promotions/validate` | Kiểm tra mã giảm giá ở giỏ hàng | – |
| POST | `/orders` | Tạo đơn `PENDING` từ giỏ hàng (giá tính lại ở server) | JWT |
| GET | `/orders/me` | Lịch sử đơn (`?status=&month=YYYY-MM&search=&page=`) | JWT |
| GET | `/orders/:id` | Chi tiết đơn + nhật ký trạng thái | JWT |
| POST | `/orders/:id/cancel` | Khách hủy đơn `PENDING`/`PAYMENT_FAILED` (hoàn kho, mã, điểm); đơn `PAID` không hủy được | JWT |
| POST | `/payments` | Thanh toán, **bắt buộc** header `Idempotency-Key` | JWT |

## Trạng thái đơn (MVP)

`PENDING → PAID` (trạng thái cuối) · `PENDING → PAYMENT_FAILED → PENDING` (thử lại) · `PENDING/PAYMENT_FAILED → CANCELLED`.
Chuyển trạng thái sai trả HTTP 409. Đơn chưa thanh toán quá `ORDER_EXPIRE_MINUTES` (mặc định 15) tự hủy.

## Task 10 – nghiệp vụ backend

| Yêu cầu | Cài đặt |
|---|---|
| Order State Machine | `src/orders/order-state-machine.ts` (`assertTransition`), `order-transitions.ts` (kèm optimistic locking + log trạng thái) |
| Thanh toán idempotent | `src/payments/payments.service.ts` – giữ chỗ `Idempotency-Key` bằng bản ghi `Payment(PROCESSING)` có ràng buộc unique |
| Tồn kho đồng thời | `src/orders/inventory.ts` – transaction + `version` (optimistic locking), xử lý theo id tăng dần để tránh deadlock |
| Khuyến mãi & điểm thưởng | `src/promotions/*`, `src/loyalty/*` (sổ điểm EARN/REDEEM/REFUND), `src/common/pricing.ts` (1 điểm = 500đ; +1 điểm / 10.000đ, cộng đúng 1 lần khi `PAID`) |
| Tự hủy đơn quá hạn | `src/orders/order-expiry.service.ts` |

## Kiểm thử

```bash
npx prisma generate   # test cần Prisma Client đã được generate
npm test
```

| File test | Chứng minh |
|---|---|
| `order-state-machine.spec.ts` | (a) chặn mọi chuyển trạng thái sai |
| `payments.service.spec.ts` | (b) gửi lại cùng `Idempotency-Key` chỉ tạo 1 giao dịch / 1 lần trừ tiền / cộng điểm 1 lần |
| `inventory.spec.ts` | (c) đặt đồng thời không vượt tồn kho |
| `promotions.service.spec.ts` | tính giảm giá (%, cố định, trần) |
| `loyalty.service.spec.ts` | cộng / trừ / hoàn điểm đúng một lần |

## Biến môi trường

Xem `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL` (CORS, nhiều origin cách nhau dấu phẩy), `ORDER_EXPIRE_MINUTES`.

> Lưu ý: thư mục này còn các file sinh ra từ `create-next-app` (`app/`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `AGENTS.md`, `public/`, `.next/`). Backend NestJS không dùng chúng (`tsconfig.build.json` chỉ biên dịch `src/`), có thể xóa an toàn.
