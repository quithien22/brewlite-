# ADR-007: Giữ tồn kho khi tạo đơn bằng cập nhật có điều kiện trong transaction
 
- **Liên quan:** FR-17, FR-26, FR-27, NFR-08

## Bối cảnh
Nhiều khách có thể đặt cùng sản phẩm cùng lúc; tồn kho không bao giờ được âm.

## Quyết định
Khi tạo đơn, trong **một transaction** thực hiện `UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty`; nếu không cập nhật được dòng nào thì ROLLBACK và trả 409. Đơn PENDING giữ kho; hủy đơn hoặc hết hạn thì hoàn kho. Cùng transaction cập nhật lượt dùng mã và điểm thưởng.

## Phương án đã cân nhắc
- Chỉ đọc rồi kiểm tra ở code: có race condition khi đồng thời.
- Trừ kho sau khi thanh toán: có thể bán quá số lượng giữa lúc đặt và lúc trả tiền.

## Hệ quả
- Ưu: Không bán quá tồn kho; đơn giản, không cần khóa phân tán.
- Nhược: Đơn chưa thanh toán giữ kho; giảm bằng hủy đơn và tự hủy quá 15 phút (FR-27).
