# BrewLite – Backend (NestJS)

REST API cho ứng dụng đặt cà phê không dùng tiền mặt. Công nghệ: **NestJS + Prisma + PostgreSQL**, xác thực **JWT (Passport)**, validate bằng **class-validator**.

## Chạy nhanh

```bash
cd backend
cp .env.example .env          # chỉnh DATABASE_URL / JWT_SECRET nếu cần
npm install
npx prisma generate
npx prisma db push            # tạo bảng
npm run seed                  # nạp menu, topping, khuyến mãi, tài khoản demo
npm run start:dev             # http://localhost:4000
```

Cần một PostgreSQL đang chạy (cách nhanh nhất: `docker compose up -d db` ở thư mục gốc).

Kiểm tra: `GET http://localhost:4000/` → `{ "message": "Hello BrewLite", "status": "ok" }`.

## Tài khoản demo (do `npm run seed` tạo)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng (120 điểm) | `demo@brewlite.vn` | `Demo1234` |
| Nhân viên quầy | `staff@brewlite.vn` | `Staff1234` |

Mã khuyến mãi mẫu: `CHAO10`, `GIAM15K`, `COMBO20`.

## Endpoint

| Method | Đường dẫn | Mô tả | Auth |
|---|---|---|---|
| GET | `/products` | Danh sách menu (`?category=&search=&featured=`) | – |
| GET | `/products/:id` | Chi tiết + tùy chọn size/topping/đường/đá | – |
| POST | `/auth/register` | Đăng ký (bcrypt, trả JWT) | – |
| POST | `/auth/login` | Đăng nhập, trả JWT | – |
| POST | `/auth/forgot-password` | Quên mật khẩu (mô phỏng gửi mail) | – |
| GET | `/auth/me` | Thông tin user + điểm thưởng | JWT |
| GET | `/promotions` | Khuyến mãi đang chạy | – |
| POST | `/promotions/validate` | Kiểm tra mã giảm giá ở giỏ hàng | – |
| POST | `/orders` | Tạo đơn `PENDING` từ giỏ hàng (giá tính lại ở server) | JWT |
| GET | `/orders/me` | Lịch sử đơn (`?status=&month=YYYY-MM&search=&page=`) | JWT |
| GET | `/orders/:id` | Chi tiết đơn + timeline | JWT |
| POST | `/orders/:id/cancel` | Khách hủy đơn (hoàn kho, mã, điểm) | JWT |
| PATCH | `/orders/:id/status` | Barista chuyển `PREPARING/READY/COMPLETED` | JWT + STAFF |
| POST | `/payments` | Thanh toán, **bắt buộc** header `Idempotency-Key` | JWT |

## Task 10 – nghiệp vụ backend

| Yêu cầu | Cài đặt |
|---|---|
| Order State Machine | `src/orders/order-state-machine.ts` (`assertTransition`), `order-transitions.ts` (kèm optimistic locking + log trạng thái) |
| Thanh toán idempotent | `src/payments/payments.service.ts` – giữ chỗ `Idempotency-Key` bằng bản ghi `Payment` có ràng buộc unique |
| Tồn kho đồng thời | `src/orders/inventory.ts` – transaction + `version` (optimistic locking), xử lý theo id tăng dần để tránh deadlock |
| Khuyến mãi & điểm thưởng | `src/promotions/*`, `src/common/pricing.ts` (1 điểm = 500đ; +1 điểm / 10.000đ, cộng đúng 1 lần khi `PAID`) |

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

## Biến môi trường

Xem `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL` (CORS, nhiều origin cách nhau dấu phẩy).

> Lưu ý: thư mục này còn các file sinh ra từ `create-next-app` (`app/`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `AGENTS.md`, `public/`, `.next/`). Backend NestJS không dùng chúng (`tsconfig.build.json` chỉ biên dịch `src/`), có thể xóa an toàn.
