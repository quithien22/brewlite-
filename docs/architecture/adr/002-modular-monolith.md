# ADR-002: API NestJS theo kiểu modular monolith

- **Liên quan:** NFR-08, NFR-19

## Bối cảnh
Phạm vi MVP nhỏ, nhóm ít người, cần transaction nhất quán giữa đơn hàng, tồn kho, khuyến mãi và điểm thưởng.

## Quyết định
Một ứng dụng NestJS chia **module theo domain**: auth, users, products, promotions, orders, payments, loyalty, health, cùng prisma, config, common. Các module gọi nhau qua service được export, không truy cập chéo bảng của nhau tùy tiện.

## Phương án đã cân nhắc
- Microservice: phức tạp triển khai, transaction phân tán, quá nặng cho MVP.
- Monolith không chia module: khó bảo trì, khó kiểm thử.

## Hệ quả
- Ưu: Triển khai và debug đơn giản; transaction nằm trong một tiến trình.
- Ưu: Có thể tách module thành service sau này.
- Nhược: Ranh giới module phải giữ bằng quy ước và review.
