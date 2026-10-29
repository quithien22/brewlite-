# ADR-003: PostgreSQL với Prisma và migration có kiểm soát phiên bản

- **Liên quan:** NFR-16, NFR-13

## Bối cảnh
Đề bắt buộc PostgreSQL; database phải tái tạo được bằng migration và seed; production cần cập nhật schema an toàn.

## Quyết định
Dùng **PostgreSQL** làm cơ sở dữ liệu, **Prisma** làm ORM. Mọi thay đổi schema đi qua **migration** (`prisma migrate`), chạy `prisma migrate deploy` khi triển khai; **không dùng `prisma db push` ở production**. Dữ liệu mẫu nạp bằng seed chạy lặp lại được.

## Phương án đã cân nhắc
- `prisma db push`: nhanh nhưng không có lịch sử thay đổi, dễ mất dữ liệu.
- SQL thuần + công cụ migration khác: tốn công hơn, mất kiểu dữ liệu an toàn của Prisma.

## Hệ quả
- Ưu: Tái tạo database trên máy sạch; có lịch sử schema trong Git.
- Ưu: Kiểu TypeScript sinh từ schema.
- Nhược: Phải viết migration khi đổi model; cần chạy migration trước khi API khởi động.
