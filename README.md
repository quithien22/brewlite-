# BrewLite – Bài tập lớn Công nghệ Phần mềm

Ứng dụng đặt cà phê không dùng tiền mặt, làm theo quy trình Agile Scrum. MVP đi từ **chọn sản phẩm → giỏ hàng → thanh toán → xác nhận đơn**.

## Cấu trúc repository

```
brewlite/
|-- apps/
|   |-- web/                    # Next.js mobile-first/PWA
|   `-- api/                    # NestJS
|-- docs/
|   |-- requirements/           # Task 1
|   |-- diagrams/               # Task 2
|   |-- architecture/           # Task 3 (ADR)
|   |-- traceability-matrix.md
|   `-- deployment.md
|-- tests/                      # Integration/E2E
|-- .github/workflows/          # CI/CD
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

| Thư mục | Nội dung |
|---|---|
| `apps/api/` | NestJS + Prisma + PostgreSQL (REST API, JWT) — xem `apps/api/README.md` |
| `apps/web/` | Next.js + TailwindCSS + Zustand — xem `apps/web/README.md` |
| `docs/` | Tài liệu: yêu cầu, sơ đồ, kiến trúc (ADR), ma trận truy vết, triển khai |
| `docker-compose.yml` | Chạy cả 3: frontend, backend, DB |

## Chạy bằng Docker  

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000 (health check: http://localhost:4000/health)
- Lần đầu backend chạy migration (`prisma migrate deploy`) rồi nạp dữ liệu mẫu.
- Nếu trước đây đã chạy bản dùng `db push`, chạy `docker compose down -v` một lần để tạo lại database sạch.
- Muốn đổi mật khẩu DB, `JWT_SECRET`... thì sao chép `.env.example` thành `.env` rồi sửa (không có `.env` thì dùng giá trị mặc định).

## Chạy thủ công

`` 
docker compose down

# 2) Backend
cd apps/api
cp .env.example .env
npm install && npx prisma generate && npx prisma migrate deploy && npm run seed
npm run start:dev            # :4000

# 3) Frontend (terminal khác)
cd apps/web
cp .env.example .env.local
npm install && npm run dev   # :3000

# 4) Mở Prisma Studio (trong apps/api)
npx prisma studio
```


## Tài khoản & mã demo

| | |
|---|---|
| Khách hàng | `demo@brewlite.vn` / `Demo1234` (120 điểm) |
| Mã khuyến mãi | `CHAO10`, `GIAM15K`, `COMBO20` |

MVP chỉ có vai trò khách hàng. Đơn thanh toán thành công ở trạng thái `PAID` (trạng thái cuối); đơn chưa thanh toán quá 15 phút sẽ tự hủy.

## Đối chiếu 10 task của đề bài

| # | Task | Vị trí |
|---|---|---|
| 1 | Khởi tạo dự án, README, `.env.example`, Git | thư mục gốc, `apps/api/`, `apps/web/` |
| 2 | API danh sách sản phẩm | `GET /products` |
| 3 | Trang Menu | `/menu` |
| 4 | Chi tiết & tùy chọn sản phẩm | `/menu/[id]` |
| 5 | Giỏ hàng | `/cart`, `apps/web/store/cart.ts` |
| 6 | API tạo đơn | `POST /orders` |
| 7 | Đăng ký / Đăng nhập JWT | `/auth/*`, `/login`, `/register` |
| 8 | Thanh toán không tiền mặt (mock) | `POST /payments`, `/checkout` |
| 9 | Xác nhận, lịch sử đơn, bàn giao | `/orders/*`, `GET /orders/me`, `docker-compose.yml` |
| 10 | Nghiệp vụ backend (state machine, idempotent, tồn kho, khuyến mãi/điểm) | `apps/api/src/orders`, `payments`, `promotions`, `loyalty` + test `npm test` |

## Kiểm thử

```bash
cd apps/api && npx prisma generate && npm test



```````````````
