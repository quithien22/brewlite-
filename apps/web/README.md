# BrewLite – Frontend (Next.js)

Giao diện web đặt cà phê không dùng tiền mặt. Công nghệ: **Next.js (App Router) + React + TypeScript + TailwindCSS + Zustand** (giỏ hàng, phiên đăng nhập). Gọi REST API của backend NestJS.

## Chạy nhanh

```bash
cd apps/web
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                    # http://localhost:3000
```

Backend phải đang chạy ở cổng 4000 (xem `apps/api/README.md`), nếu không trang sẽ báo "Không thể kết nối tới máy chủ". Tài khoản demo: `demo@brewlite.vn` / `Demo1234`.

## Các trang

| Route | Màn hình |
|---|---|
| `/` | Trang chủ |
| `/menu` | Thực đơn (lọc danh mục, tìm kiếm; loading / empty / lỗi) |
| `/menu/detail?id=…` | Chi tiết sản phẩm (size, topping, đường, đá, số lượng) |
| `/cart` | Giỏ hàng (sửa/xóa, mã giảm giá, điểm thưởng, ghi chú) |
| `/checkout` | Thanh toán (Ví / Thẻ, không tiền mặt) |
| `/orders/success?id=…` | Đặt hàng thành công (mã đơn, trạng thái `PAID`) |
| `/orders/failed?id=…` | Thanh toán thất bại (`PAYMENT_FAILED`, thử lại / hủy, giỏ hàng được giữ) |
| `/orders` | Lịch sử đơn hàng (lọc trạng thái / tháng / mã đơn, phân trang). Chưa đăng nhập thì hiện thông báo "Bạn cần đăng nhập để xem đơn hàng" kèm nút đăng nhập |
| `/orders/detail?id=…` | Chi tiết đơn (timeline, hủy đơn chưa thanh toán, **hủy và hoàn tiền** đơn đã thanh toán trong thời hạn) |
| `/promotions` | Khuyến mãi (sao chép mã) |
| `/login`, `/register`, `/forgotpassword` | Đăng nhập, Đăng ký, Quên mật khẩu |
| `not-found.tsx`, `error.tsx`, `ErrorState` | 404 và lỗi kết nối |

Các trang cần đăng nhập (chi tiết đơn, thành công, thất bại, thanh toán) tự chuyển sang `/login?next=…` và quay lại đúng trang sau khi đăng nhập.

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
3. Thành công → xóa giỏ, sang `/orders/success?id=…`. Thất bại → giữ giỏ, sang `/orders/failed?id=…` để thử lại hoặc hủy.
4. Nếu lần trước còn đơn dang dở (`pendingOrderId`), đơn đó được hủy trước khi tạo đơn mới để hoàn kho / mã / điểm.

Tích chọn "Chế độ demo" ở bước thanh toán để mô phỏng thanh toán lỗi.

## Hủy đơn và hoàn tiền

- Đơn `PENDING` / `PAYMENT_FAILED`: nút **Hủy đơn** (`POST /orders/:id/cancel`).
- Đơn `PAID`: nút **Hủy và hoàn tiền** (`POST /payments/refund`) chỉ hiện khi `order.canRefund` là true, tức còn trong `REFUND_WINDOW_MINUTES` phút (mặc định 5) kể từ lúc thanh toán. Hạn chót hiển thị ở banner đầu trang chi tiết đơn.
- Hoàn tiền xong đơn chuyển `REFUNDED` (badge "Đã hoàn tiền"), điểm đã dùng được hoàn lại, điểm đã cộng bị thu hồi. Nếu khách đã tiêu bớt điểm của đơn đó, server từ chối và hiện thông báo lỗi.
