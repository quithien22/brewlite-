# ADR-008: Quản lý trạng thái đơn bằng máy trạng thái, MVP không có trạng thái pha chế
 
- **Liên quan:** FR-24, FR-25, FR-26, FR-28

## Bối cảnh
MVP chỉ có khách hàng, không có nhân viên cập nhật tiến trình pha chế; cần ngăn chuyển trạng thái sai và có nhật ký.

## Quyết định
Trạng thái đơn: `PENDING`, `PAID`, `PAYMENT_FAILED`, `CANCELLED`. Chuyển hợp lệ: PENDING → PAID | PAYMENT_FAILED | CANCELLED; PAYMENT_FAILED → PENDING | CANCELLED; **PAID là trạng thái cuối**. Mọi chuyển đi qua `OrderStatusMachine`, ghi một dòng `OrderStatusLog`, dùng khóa lạc quan theo `version`. Client không có API đặt trạng thái trực tiếp. Các trạng thái PREPARING, READY, COMPLETED để dành cho giai đoạn mở rộng có nhân viên.

## Phương án đã cân nhắc
- Cho client gửi trạng thái: không an toàn.
- Thêm ngay trạng thái pha chế: không có ai cập nhật trong MVP.

## Hệ quả
- Ưu: Không thể chuyển sai bước; có lịch sử để theo dõi.
- Nhược: Khi thêm nhân viên pha chế phải mở rộng máy trạng thái và phân quyền.
