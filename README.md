# BrewLite – Bài tập lớn Công nghệ Phần mềm

Ứng dụng đặt cà phê không dùng tiền mặt, làm theo quy trình Agile Scrum. MVP đi từ **chọn sản phẩm → giỏ hàng → thanh toán → xác nhận đơn**, kèm hủy đơn và hoàn tiền trong thời hạn cho phép.

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
- PostgreSQL: `localhost:5433` (user / mật khẩu / database đều là `brewlite`). Cổng 5433 trên máy host để không đụng PostgreSQL cài sẵn ở 5432; bên trong Docker backend vẫn nối tới `db:5432`.
- Lần đầu backend tự chạy migration (`prisma migrate deploy`) rồi nạp dữ liệu mẫu.
- Nếu trước đây đã chạy bản dùng `db push` hoặc mật khẩu DB đã đổi, chạy `docker compose down -v` một lần để tạo lại database sạch (**xóa toàn bộ dữ liệu trong DB**).
- Muốn đổi mật khẩu DB, `JWT_SECRET`... thì sao chép `.env.example` thành `.env` rồi sửa (không có `.env` thì dùng giá trị mặc định).

## Chạy thủ công

```bash
# 1) Database (cổng 5433 trên máy host)
docker compose up -d db

# 2) Backend
cd apps/api
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev               # http://localhost:4000

# 3) Frontend (terminal khác)
cd apps/web
cp .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
npm install
npm run dev                     # http://localhost:3000

# 4) Prisma Studio (tùy chọn, chạy trong apps/api)
npx prisma studio               # http://localhost:5555
```

Dán từng lệnh một vào terminal, không dán lệnh vào file `.env`.

## Tài khoản & mã demo

| | |
|---|---|
| Khách hàng | `demo@brewlite.vn` / `Demo1234` (120 điểm) |
| Mã khuyến mãi | `CHAO10`, `GIAM15K`, `COMBO20` |

MVP chỉ có vai trò khách hàng. Trạng thái đơn:

- Thanh toán thành công → `PAID`.
- Khách có thể **hủy và được hoàn tiền** (`REFUNDED`) trong `REFUND_WINDOW_MINUTES` phút (mặc định 5) kể từ lúc thanh toán. Hoàn tiền trả lại tồn kho, mã giảm giá, điểm đã dùng và thu hồi điểm đã cộng.
- Đơn chưa thanh toán quá 15 phút (`ORDER_EXPIRE_MINUTES`) tự hủy.

## Đối chiếu 10 task của đề bài

| # | Task | Vị trí |
|---|---|---|
| 1 | Khởi tạo dự án, README, `.env.example`, Git | thư mục gốc, `apps/api/`, `apps/web/` |
| 2 | API danh sách sản phẩm | `GET /products` |
| 3 | Trang Menu | `/menu` |
| 4 | Chi tiết & tùy chọn sản phẩm | `/menu/detail?id=...` |
| 5 | Giỏ hàng | `/cart`, `apps/web/store/cart.ts` |
| 6 | API tạo đơn | `POST /orders` |
| 7 | Đăng ký / Đăng nhập JWT | `/auth/*`, `/login`, `/register` |
| 8 | Thanh toán không tiền mặt (mock) | `POST /payments`, `POST /payments/refund`, `/checkout` |
| 9 | Xác nhận, lịch sử đơn, bàn giao | `/orders/*`, `GET /orders/me`, `docker-compose.yml` |
| 10 | Nghiệp vụ backend (state machine, idempotent, tồn kho, khuyến mãi/điểm, hoàn tiền) | `apps/api/src/orders`, `payments`, `promotions`, `loyalty` + test `npm test` |

## Kiểm thử

```bash
cd apps/api
npx prisma generate
npm test
```

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân và cách xử lý |
|---|---|
| `P1000 Authentication failed` khi `migrate deploy` / `seed` | Sai user/mật khẩu hoặc `localhost:5432` đang trỏ tới Postgres khác. Dùng `DATABASE_URL` cổng **5433** của container; nếu volume cũ có mật khẩu khác thì `docker compose down -v` rồi `docker compose up -d db`. |
| `P1012 the URL must start with postgresql://` | `DATABASE_URL` trong `apps/api/.env` bị dính ký tự lạ (ví dụ lệnh dán nhầm vào file). Mở file và sửa lại đúng một dòng. |
| Prisma Studio mở được nhưng không có bảng / "Unable to run script" | Migration chưa chạy hoặc DB chưa kết nối được. Chạy `npx prisma migrate deploy` trước. |
| Web báo "Không thể kết nối tới máy chủ" (`ERR_CONNECTION_REFUSED`) | Backend chưa chạy ở cổng 4000. Chạy `npm run start:dev` trong `apps/api` (hoặc `docker compose up -d --build backend`). |
| TypeScript báo thiếu `REFUNDED` / `REVOKE` | Chạy `npx prisma migrate deploy` rồi `npx prisma generate` trong `apps/api`. |
