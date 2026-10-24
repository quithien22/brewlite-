# BrewLite – Frontend (Next.js)

Giao diện web đặt cà phê không dùng tiền mặt. Công nghệ: **Next.js (App Router) + React + TypeScript + TailwindCSS + Zustand** (giỏ hàng, phiên đăng nhập). Gọi REST API của backend NestJS.

## Chạy nhanh

```bash
cd frontend/my-app
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                    # http://localhost:3000
```

Backend phải đang chạy (xem `backend/README.md`). Tài khoản demo: `demo@brewlite.vn` / `Demo1234`.

## Các trang (khớp thư mục `ban_thiet_ke`)

| Route | Màn hình thiết kế |
|---|---|
| `/` | Trang chủ |
| `/menu` | Thực đơn (lọc danh mục, tìm kiếm; loading / empty / lỗi) |
| `/menu/[id]` | Chi tiết sản phẩm (size, topping, đường, đá, số lượng) |
| `/cart` | Giỏ hàng (sửa/xóa, mã giảm giá, điểm thưởng, ghi chú) |
| `/checkout` | Thanh toán (Ví / Thẻ, không tiền mặt) |
| `/orders/[id]/success` | Đặt hàng thành công (mã đơn, trạng thái `PAID`) |
| `/orders/[id]/failed` | Thanh toán thất bại (`PAYMENT_FAILED`, thử lại / hủy, giỏ hàng được giữ) |
| `/orders` | Lịch sử đơn hàng (lọc trạng thái / tháng / mã đơn, phân trang) |
| `/orders/[id]` | Chi tiết đơn (tiến độ, timeline, hủy đơn) |
| `/promotions` | Khuyến mãi (sao chép mã) |
| `/login`, `/register`, `/forgotpassword` | Đăng nhập, Đăng ký, Quên mật khẩu |
| `not-found.tsx`, `error.tsx`, `ErrorState` | 404 và lỗi kết nối |

## Cấu trúc

```
app/            # route (mỗi page.tsx chỉ ghép view)
components/
  views/        # nội dung từng trang (client component)
  product/      # ProductCard, FeaturedProducts
  auth/         # Login, Register, ForgotPassword
  ui/           # States, StatusBadge, OrderSummaryCard, ...
lib/            # api.ts (gọi backend), types.ts, hooks.ts, format.ts, cart-totals.ts
store/          # auth.ts, cart.ts (Zustand + localStorage)
```

## Luồng đặt hàng (khớp backend)

1. Chọn món → `store/cart` (giá hiển thị chỉ để tham khảo, backend luôn tính lại).
2. `/checkout` → `POST /orders` (đơn `PENDING`) → `POST /payments` kèm header **`Idempotency-Key`** mới cho mỗi lần thanh toán.
3. Thành công → xóa giỏ, sang `/orders/[id]/success`. Thất bại → giữ giỏ, sang `/orders/[id]/failed` để thử lại hoặc hủy.
4. Nếu lần trước còn đơn dang dở (`pendingOrderId`), đơn đó được hủy trước khi tạo đơn mới để hoàn kho / mã / điểm.

Tích chọn "Chế độ demo" ở bước thanh toán để mô phỏng thanh toán lỗi.
