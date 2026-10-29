# ADR-006: Chống thanh toán trùng bằng Idempotency-Key lưu trong bảng payments

- **Liên quan:** FR-19, FR-21, NFR-08

## Bối cảnh
Khách có thể bấm thanh toán nhiều lần hoặc mạng chập chờn khiến client gửi lại yêu cầu; không được trừ tiền hai lần.

## Quyết định
`POST /payments` **bắt buộc** header `Idempotency-Key` (8–100 ký tự). Khóa lưu trong `payments.idempotencyKey` với ràng buộc **unique**. Gửi lại cùng khóa trả kết quả đã lưu (`replayed = true`), không gọi cổng lần nữa và không cộng điểm lần hai. Cùng khóa nhưng khác đơn hoặc khác người: 422. Đơn đang có giao dịch PROCESSING: 409.

## Phương án đã cân nhắc
- Chỉ chặn ở giao diện (vô hiệu nút): không an toàn khi mạng lỗi hoặc gọi API trực tiếp.
- Redis/kho khóa riêng: thêm thành phần hạ tầng.

## Hệ quả
- Ưu: Đảm bảo ở tầng dữ liệu bằng unique constraint; không cần thêm dịch vụ.
- Nhược: Bảng payments giữ lịch sử khóa; client phải sinh UUID cho mỗi lần thanh toán.
