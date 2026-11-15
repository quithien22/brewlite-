# Ma trận truy vết BrewLite (MVP)

Truy vết hai chiều: **Yêu cầu → Use-case/User Story → Thiết kế/Sơ đồ → Code/API → Test**.
Nguồn yêu cầu: `docs/requirements/context-and-scope.md` (FR-01…FR-33, NFR-01…NFR-19).
Cập nhật cùng pull request mỗi khi đổi yêu cầu, API hoặc test (NFR-19, AC-N19.2).

Cách đọc: ô `—` nghĩa là **chưa có**. Các ô này là khoảng trống cần xử lý, xem mục 6.

## 1. Danh mục mã dùng trong ma trận

### 1.1 User Story / Use-case

| Mã | Nội dung |
|---|---|
| UC-01 | Đặt và thanh toán đơn hàng (đặc tả trong tài liệu yêu cầu, mục 1.3) |
| US-01 | Đăng ký tài khoản |
| US-02 | Đăng nhập / đăng xuất |
| US-03 | Xem hồ sơ và điểm thưởng |
| US-04 | Xem menu, tìm kiếm, lọc |
| US-05 | Xem chi tiết và chọn tùy chọn đồ uống |
| US-06 | Quản lý giỏ hàng |
| US-07 | Áp mã khuyến mãi, dùng điểm thưởng |
| US-08 | Xem lịch sử và chi tiết đơn |
| US-09 | Hủy đơn |

> US-01…US-09 do nhóm đặt tên để có chỗ truy vết. Tài liệu yêu cầu chỉ đặc tả đầy đủ UC-01.

### 1.2 Sơ đồ

| Mã | Tệp | Trạng thái |
|---|---|---|
| Sequence-01a | `docs/diagrams/sequence-checkout-01a.puml` / `.svg` (POST /orders) | Có |
| Sequence-01b | `docs/diagrams/sequence-checkout-01b.puml` / `.svg` (POST /payments) | Có |
| Activity-01a, Activity-01b | `docs/diagrams/activity-checkout-*.svg` | **Chưa có trong repo** |
| Class-01 | `docs/diagrams/class-domain.mmd` / `.svg` | **Chưa có trong repo** |
| ADR-001…011 | `docs/architecture/adr/*.md` | Có (xem mục 6 về ADR-011) |

### 1.3 Test

Kiểm thử đơn vị nằm cạnh mã nguồn trong `apps/api/src`, chạy bằng `npm test`. E2E nằm trong `tests/e2e`, cần API và DB đã chạy.

| Mã | Tệp | Nội dung |
|---|---|---|
| UT-LOY-01…05 | `loyalty/loyalty.service.spec.ts` | 01 EARN đúng một lần; 02 EARN 0 điểm không ghi sổ; 03 REDEEM trừ điểm; 04 REDEEM vượt số dư → 422; 05 REFUND đúng một lần |
| UT-INV-01…07 | `orders/inventory.spec.ts` | 01 10 request đồng thời, tồn 5 → đúng 5 thành công; 02 đơn nhiều ly không bán quá tồn; 03 vượt tồn → "chỉ còn N phần"; 04 tồn 0 → "đã hết hàng"; 05 tăng `version`; 06 trả kho khi hủy; 07 sản phẩm không tồn tại → 400 |
| UT-SM-01…07 | `orders/order-state-machine.spec.ts` | 01 các cạnh hợp lệ; 02 chặn mọi cạnh còn lại bằng 409; 03 PAID chỉ sang REFUNDED; 04 trạng thái kết thúc; 05 đơn REFUNDED không đổi tiếp; 06 chỉ hủy được PENDING/PAYMENT_FAILED; 07 thông báo lỗi nêu rõ nguồn và đích |
| UT-PAY-01…06 | `payments/payments.service.spec.ts` (nhóm "Thanh toán idempotent") | 01 cùng key gửi 2 lần, cổng gọi 1 lần; 02 gửi 3 lần chỉ 1 bút toán EARN; 03 hai request song song cùng key; 04 đơn PAID không thanh toán lại bằng key khác; 05 dùng lại key cho người khác → 422; 06 thất bại → PAYMENT_FAILED, thử lại bằng key mới |
| UT-PAY-07…11 | cùng tệp (nhóm "Bảo vệ thanh toán giả lập") | 07 một key không đổi được phương thức; 08 lỗi rồi thanh toán lại chỉ cộng điểm một lần; 09 PROCESSING quá 2 phút → FAILED; 10 đang PROCESSING dưới 2 phút, key khác → 409; 11 cùng key khi đang PROCESSING → 409 |
| UT-PAY-12…19 | cùng tệp (nhóm "Hủy đơn + hoàn tiền") | 12 hoàn tiền trong hạn; 13 bấm hai lần; 14 hai request song song; 15 quá hạn → 422; 16 đã tiêu điểm → 422; 17 cổng lỗi → 502; 18 đơn chưa thanh toán → 409; 19 đơn người khác → 404 |
| UT-PRM-01…04 | `promotions/promotions.service.spec.ts` | 01 giảm 10%; 02 chặn bởi `maxDiscount`; 03 giảm cố định; 04 không giảm quá tạm tính |
| E2E-SMOKE | `tests/e2e/smoke.mjs` | health → đăng nhập → danh sách sản phẩm → tạo đơn PENDING → thanh toán → thanh toán lặp cùng key (replayed) → đơn PAID → hủy đơn PAID bị 400 |
| E2E-LOGIN | `tests/e2e/login.test.mjs` | đăng nhập thành công, 401 sai thông tin, 400 đầu vào sai (kể cả trường lạ), `GET /auth/me` với token hợp lệ / không có / giả |

## 2. Truy vết yêu cầu chức năng

| Mã yêu cầu | Ưu tiên | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test |
|---|---|---|---|---|---|
| FR-01 Đăng ký | Must | US-01 | ADR-004 | `POST /auth/register` — `auth.controller.ts`, `auth.service.ts`, `dto/auth.dto.ts`; web `/register` | — |
| FR-02 Đăng nhập | Must | US-02; UC-01 bước 2, 2a | ADR-004 | `POST /auth/login` — `auth.service.ts`; web `/login` | E2E-LOGIN, E2E-SMOKE |
| FR-03 Đăng xuất | Must | US-02 | ADR-004, ADR-009 | `logout()` trong `apps/web/store/auth.ts` (xóa token phía client) | — |
| FR-04 Hồ sơ và điểm | Should | US-03 | ADR-004 | `GET /auth/me` — `auth.controller.ts`, `jwt.strategy.ts`, `JwtAuthGuard` | E2E-LOGIN (nhóm "Token sau đăng nhập") |
| FR-05 Danh sách menu | Must | US-04 | Activity-01a (thiếu file) | `GET /products` — `products.controller.ts`, `products.service.ts`; web `/menu` | E2E-SMOKE (bước GET /products) |
| FR-06 Tìm kiếm, lọc | Should | US-04 | — | `GET /products?search&category&featured` — `dto/list-products.query.ts` | — |
| FR-07 Chi tiết, tùy chọn | Must | US-05 | Class-01 (thiếu file) | `GET /products/:id` — `products.service.ts`, `common/pricing.ts`; web `/menu/detail` | — |
| FR-08 Còn hàng / hết hàng | Must | US-04, UC-01 luồng phụ | ADR-007 | trường `inStock`; `reserveStock` trong `orders/inventory.ts`; seed có "Cold brew cam" tồn 0 | UT-INV-03, UT-INV-04 |
| FR-09 Khuyến mãi đang chạy | Should | US-07 | — | `GET /promotions` — `promotions.controller.ts`, `promotions.service.ts` | — |
| FR-10 Thao tác giỏ hàng | Must | US-06; UC-01 bước 1 | ADR-009 | `apps/web/store/cart.ts`; web `/cart` | — |
| FR-11 Tính tổng tiền giỏ | Must | US-06; UC-01 bước 1, 3 | ADR-009 | `apps/web/lib/cart-totals.ts`; `apps/api/src/common/pricing.ts` | — |
| FR-12 Lưu giỏ khi tải lại | Should | US-06 | ADR-009 | Zustand `persist` (localStorage) trong `store/cart.ts` | — |
| FR-13 Áp mã khuyến mãi | Should | US-07; UC-01 luồng 3a | Sequence-01a | `POST /promotions/validate` — `promotions.service.ts` (`calcDiscount`) | UT-PRM-01…04 (chỉ phần tính tiền, chưa test hạn dùng, lượt, đơn tối thiểu) |
| FR-14 Dùng điểm thưởng | Should | US-07; UC-01 luồng 3b | Sequence-01a | `loyalty.service.ts` (`redeem`); trường `pointsToUse` của `POST /orders` | UT-LOY-03, UT-LOY-04 |
| FR-15 Ghi chú đơn | Could | UC-01 bước 3 | — | trường `note` của `POST /orders` — `dto/create-order.dto.ts` | — |
| FR-16 Tạo đơn PENDING | Must | UC-01 bước 5–6 | Sequence-01a, Activity-01a (thiếu file) | `POST /orders` — `orders.controller.ts`, `orders.service.ts`, `dto/create-order.dto.ts` | E2E-SMOKE (bước POST /orders) |
| FR-17 Giữ tồn kho | Must | UC-01 bước 5, ngoại lệ E3 | Sequence-01a, ADR-007 | `orders/inventory.ts` (`reserveStock`, khóa lạc quan theo `version`) | UT-INV-01…07 |
| FR-18 Thanh toán Ví / Thẻ | Must | UC-01 bước 7–9 | Sequence-01b, ADR-005 | `POST /payments` — `payments.controller.ts`, `payments.service.ts`, `mock-payment.gateway.ts` | E2E-SMOKE; UT-PAY-01, UT-PAY-04 |
| FR-19 Chống thanh toán trùng | Must | UC-01 luồng 8a, ngoại lệ E6 | Sequence-01b, ADR-006 | header `Idempotency-Key` kiểm tra trong `payments.controller.ts`; unique `Payment.idempotencyKey` | E2E-SMOKE (bước lặp key); UT-PAY-01, 02, 03, 05, 07, 10, 11 |
| FR-20 Thanh toán thất bại | Must | UC-01 luồng 9a | Sequence-01b, Activity-01b (thiếu file) | `payments.service.ts` → `PAYMENT_FAILED`; web `/orders/failed` | UT-PAY-06, UT-PAY-08 |
| FR-21 Cộng điểm thưởng | Should | UC-01 bước 9 | Sequence-01b | `loyalty.service.ts` (`earn`) | UT-LOY-01, UT-LOY-02, UT-PAY-02, UT-PAY-08 |
| FR-22 Màn hình xác nhận / lỗi | Must | UC-01 bước 10, ngoại lệ E7 | Sequence-01b | web `/orders/success`, `/orders/failed`, `/checkout` | — |
| FR-23 Lịch sử đơn | Must | US-08 | — | `GET /orders/me` — `orders.controller.ts`, `dto/order-query.dto.ts`; web `/orders` | — |
| FR-24 Chi tiết đơn | Must | US-08 | Class-01 (thiếu file) | `GET /orders/:id` — `orders.service.ts` (`findOneForUser`); web `/orders/detail` | E2E-SMOKE (bước GET /orders/:id) |
| FR-25 Máy trạng thái đơn | Must | UC-01 bước 9, luồng 9a | ADR-008, Class-01 (thiếu file) | `orders/order-state-machine.ts`, `order-transitions.ts` | UT-SM-01…07 |
| FR-26 Hủy đơn | Should | US-09; UC-01 luồng 9a | ADR-008 | `POST /orders/:id/cancel`; `releaseStock` trong `inventory.ts`; `loyalty.refund` | UT-INV-06, UT-LOY-05; E2E-SMOKE (hủy đơn PAID bị 400) |
| FR-27 Tự hủy đơn quá hạn | Could | US-09 | — | `orders/order-expiry.service.ts` (`ORDER_EXPIRE_MINUTES`) | — |
| FR-28…FR-31 | Won't | — | — | Không triển khai | — |
| FR-32 Quên mật khẩu | Won't | — | — | **Đã có code** `POST /auth/forgot-password`, web `/forgotpassword` | — |
| FR-33 Hoàn tiền | Won't | — | — | **Đã có code** `POST /payments/refund`, trạng thái `REFUNDED` | UT-PAY-12…19, UT-SM-03…05 |

## 3. Truy vết yêu cầu phi chức năng

| Mã | Nội dung | Thiết kế | Code / cấu hình | Test / bằng chứng |
|---|---|---|---|---|
| NFR-01…03 | Hiệu năng | — | — | — (chưa đo) |
| NFR-04 | bcrypt, JWT có thời hạn, API riêng tư cần JWT | ADR-004 | `jwt.strategy.ts`, `auth.module.ts` (`JWT_EXPIRES_IN`), `JwtAuthGuard` | E2E-LOGIN (token giả → 401, không lộ `passwordHash`) |
| NFR-05 | Validate đầu vào, whitelist | — | `ValidationPipe` trong `main.ts` (`whitelist`, `forbidNonWhitelisted`) | E2E-LOGIN (nhóm "Đầu vào không hợp lệ (400)") |
| NFR-06 | Khách chỉ thấy dữ liệu của mình; giá do máy chủ tính | ADR-009 | `orders.service.ts` lọc theo `userId`; `payments.service.ts` lấy số tiền từ CSDL | UT-PAY-19; chưa có test cho `GET /orders/:id` của người khác |
| NFR-07 | Secret không nằm trong repo/log CI; HTTPS | — | `.gitignore` (root, api, web), `.env.example`, `.dockerignore`; `main.ts` không log header/body | Rà soát thủ công; **chưa quét lịch sử Git** |
| NFR-08 | Transaction và nhất quán khi đồng thời | ADR-007 | `$transaction` trong `orders.service.ts`, `payments.service.ts` | UT-INV-01, 02; UT-PAY-03, 14 |
| NFR-09…12 | Khả dụng, PWA, tiếng Việt, tương thích | — | `apps/web` | — (chưa kiểm) |
| NFR-13 | `docker compose up --build` chạy đủ ba thành phần | ADR-010 | `docker-compose.yml`, `apps/*/Dockerfile`, `.env.example` | Chưa có bằng chứng chạy trên máy sạch |
| NFR-14 | URL production HTTPS, DB không public | ADR-011 | `docs/deployment.md` (**hiện chỉ có 2 dòng rác**) | — |
| NFR-15 | CI/CD và rollback | ADR-010 | `.github/workflows/node.js.yml` (CI), `nextjs.yml` (deploy web lên GitHub Pages); **chưa có CD cho API** | CI: `api`, `web`, `e2e` |
| NFR-16 | DB tái tạo bằng migration và seed | ADR-003 | `apps/api/prisma/migrations/*`, `prisma/seed.ts` (idempotent) | Job `e2e` trong CI chạy `migrate deploy` + `db seed` |
| NFR-17 | `GET /health`, cấu hình qua biến môi trường | — | `health/health.controller.ts` (200 / 503); `ConfigService.getOrThrow` | E2E-SMOKE (bước GET /health) |
| NFR-18 | Unit, integration, E2E | — | `*.spec.ts`, `tests/e2e/*` | Mục 1.3. **Chưa có integration test riêng cho `POST /orders`, `POST /payments`** |
| NFR-19 | Module hóa, có ma trận truy vết | ADR-002 | tệp này | — |

## 4. Truy vết ngược: test → yêu cầu

| Test | Yêu cầu kiểm chứng |
|---|---|
| UT-LOY-01, 02 | FR-21 |
| UT-LOY-03, 04 | FR-14 |
| UT-LOY-05 | FR-26 |
| UT-INV-01, 02, 05 | FR-17, NFR-08 |
| UT-INV-03, 04 | FR-08, FR-17 |
| UT-INV-06 | FR-26 |
| UT-INV-07 | FR-16 |
| UT-SM-01…07 | FR-25 (UT-SM-03…05 còn liên quan FR-33) |
| UT-PAY-01…05, 07, 10, 11 | FR-18, FR-19 |
| UT-PAY-06, 08, 09 | FR-20 (UT-PAY-08 còn FR-21) |
| UT-PAY-12…19 | FR-33; UT-PAY-19 còn NFR-06 |
| UT-PRM-01…04 | FR-13 |
| E2E-SMOKE | FR-02, 05, 16, 18, 19, 24, 26; NFR-17 |
| E2E-LOGIN | FR-02, FR-04; NFR-04, NFR-05 |

## 5. Phủ yêu cầu Must

| | Số lượng | Ghi chú |
|---|---|---|
| FR mức Must | 17 (FR-01, 02, 03, 05, 07, 08, 10, 11, 16, 17, 18, 19, 20, 22, 23, 24, 25) | Mỗi FR đều có dòng trong mục 2 (AC-N19.1) |
| Must **chưa có test** | FR-01, 03, 07, 10, 11, 22, 23 | Cần bổ sung |
| Must chỉ có test gián tiếp | FR-05, 16, 24 (chỉ qua E2E-SMOKE) | Nên thêm integration test |

## 6. Khoảng trống và điểm lệch giữa tài liệu và mã

1. **Sơ đồ thiếu trong repo.** Tài liệu yêu cầu dẫn tới Activity-01a/01b và Class-01 (cùng use-case diagram, C4, deployment diagram) nhưng `docs/diagrams` chỉ có hai sequence diagram.
2. **Yêu cầu Won't nhưng đã làm.** FR-32 (quên mật khẩu) và FR-33 (hoàn tiền) đã có code. Hoặc đổi chúng thành Should và bổ sung AC, hoặc ghi rõ đây là phần mở rộng. Hiện `OrderStatus` trong code có thêm `REFUNDED` và loại sổ điểm `REVOKE`, lệch với mô hình của tài liệu.
3. **Triển khai.** Tài liệu mô tả AWS EC2 + nginx (ADR-011-aws-ec2-platform, `docker-compose.prod.yml`, `ci.yml` / `cd.yml`). Repo có `011-render-platform.md`, workflow `node.js.yml` và `nextjs.yml` (GitHub Pages), chưa có pipeline CD cho API. Cần chọn một nền tảng và đồng bộ ADR, sơ đồ triển khai và workflow.
4. **`docs/deployment.md` đang rỗng nội dung.** Mới có hai dòng lệnh PowerShell. Chưa có hướng dẫn deploy, rollback, URL production.
5. **Tên lớp lệch.** Tài liệu ghi `SimulatedPaymentGateway` trong `payments/gateway`; code là `MockPaymentGateway` trong `payments/mock-payment.gateway.ts`.
6. **Thiếu test.** Chưa có integration test cho `POST /orders`, `POST /payments`; chưa có test cho đăng ký, danh sách/tìm kiếm sản phẩm, lịch sử đơn, tự hủy đơn quá hạn; chưa đo NFR-01…03.
