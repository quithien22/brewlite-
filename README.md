# BrewLite – Bài tập lớn Công nghệ Phần mềm

Ứng dụng đặt cà phê không dùng tiền mặt, làm theo quy trình Agile Scrum. MVP đi từ **chọn sản phẩm → giỏ hàng → thanh toán → xác nhận đơn**.

| Thư mục | Nội dung |
|---|---|
| `backend/` | NestJS + Prisma + PostgreSQL (REST API, JWT) — xem `backend/README.md` |
| `frontend/my-app/` | Next.js + TailwindCSS + Zustand — xem `frontend/my-app/README.md` |
| `ban_thiet_ke/` | Bản thiết kế giao diện (14 màn hình desktop) |
| `docker-compose.yml` | Chạy cả 3: frontend, backend, DB |

## Chạy bằng Docker (khuyến nghị để demo)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Lần đầu backend tự tạo bảng và nạp dữ liệu mẫu.

## Chạy thủ công

```bash
# 1) Database
#MỞ
docker compose up -d
docker compose up -d db
#TẮT
docker compose down

# 2) Backend
cd backend
cp .env.example .env
npm install && npx prisma generate && npx prisma db push && npm run seed
npm run start:dev            # :4000

# 3) Frontend (terminal khác)
cd frontend/my-app
cp .env.example .env.local
npm install && npm run dev   # :3000

#4) Mở frisma studio 
npx prisma studio
```


## Tài khoản & mã demo

| | |
|---|---|
| Khách hàng | `demo@brewlite.vn` / `Demo1234` (120 điểm) |
| Nhân viên quầy | `staff@brewlite.vn` / `Staff1234` |
| Mã khuyến mãi | `CHAO10`, `GIAM15K`, `COMBO20` |

Cập nhật tiến độ đơn (barista) bằng `PATCH /orders/:id/status` với token của tài khoản STAFF; trang chi tiết đơn của khách tự làm mới mỗi 8 giây.

## Đối chiếu 10 task của đề bài

| # | Task | Vị trí |
|---|---|---|
| 1 | Khởi tạo dự án, README, `.env.example`, Git | thư mục gốc, `backend/`, `frontend/my-app/` |
| 2 | API danh sách sản phẩm | `GET /products` |
| 3 | Trang Menu | `/menu` |
| 4 | Chi tiết & tùy chọn sản phẩm | `/menu/[id]` |
| 5 | Giỏ hàng | `/cart`, `store/cart.ts` |
| 6 | API tạo đơn | `POST /orders` |
| 7 | Đăng ký / Đăng nhập JWT | `/auth/*`, `/login`, `/register` |
| 8 | Thanh toán không tiền mặt (mock) | `POST /payments`, `/checkout` |
| 9 | Xác nhận, lịch sử đơn, bàn giao | `/orders/*`, `GET /orders/me`, `docker-compose.yml` |
| 10 | Nghiệp vụ backend (state machine, idempotent, tồn kho, khuyến mãi/điểm) | `backend/src/orders`, `payments`, `promotions` + test `npm test` |

## Kiểm thử

```bash
cd backend && npx prisma generate && npm test
```
