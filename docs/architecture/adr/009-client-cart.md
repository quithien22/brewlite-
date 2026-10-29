# ADR-009: Giỏ hàng lưu ở trình duyệt, máy chủ luôn tính lại giá
 
- **Liên quan:** FR-10, FR-11, FR-12, FR-16, NFR-06

## Bối cảnh
Giỏ hàng chỉ cần thiết trước khi đặt đơn; không muốn thêm bảng và API giỏ hàng cho MVP.

## Quyết định
Giỏ hàng lưu bằng **Zustand + localStorage** (gồm ghi chú, mã đã áp, điểm chọn). Khi đặt đơn, client chỉ gửi sản phẩm, tùy chọn, số lượng, mã, điểm; **máy chủ tính lại toàn bộ giá** từ CSDL, bỏ qua mọi giá do client gửi.

## Phương án đã cân nhắc
- Giỏ hàng lưu trong CSDL: đồng bộ nhiều thiết bị nhưng thêm bảng, API và dọn dữ liệu.

## Hệ quả
- Ưu: Đơn giản, giỏ không mất khi tải lại trang.
- Ưu: Chống gian lận giá.
- Nhược: Giỏ không đồng bộ giữa các thiết bị.
