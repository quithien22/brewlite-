# ADR-005: Cổng thanh toán mô phỏng là module sau interface PaymentGateway

- **Liên quan:** FR-18, FR-20, NFR-03

## Bối cảnh
Đề cho phép thanh toán Ví/Thẻ mô phỏng. Không cần dịch vụ ngoài nhưng phải xử lý được thành công, thất bại và chậm.

## Quyết định
Định nghĩa interface **`PaymentGateway`** (`charge(orderId, amount, method, key)`). Bản **`SimulatedPaymentGateway`** chạy cùng tiến trình API, có thể ép thất bại bằng cấu hình để demo. Số tiền luôn lấy từ CSDL, không nhận từ client. Giao dịch quá 2 phút không phản hồi được coi là thất bại.

## Phương án đã cân nhắc
- Dịch vụ mô phỏng riêng (container thứ tư): thêm hạ tầng không cần thiết.
- Tích hợp cổng thật (sandbox): ngoài phạm vi và phụ thuộc bên ngoài.

## Hệ quả
- Ưu: Đơn giản; thay bằng cổng thật chỉ cần viết lớp mới.
- Nhược: Không kiểm thử được lỗi mạng thật giữa hai hệ thống.
