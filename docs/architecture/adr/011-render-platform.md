# ADR-011: Triển khai production trên Render (region Singapore)
 
- **Liên quan:** NFR-14, NFR-07, NFR-17

## Bối cảnh
Cần URL production qua HTTPS, database có lưu trữ bền và không public, chi phí thấp hoặc miễn phí, tích hợp được với image và deploy hook.

## Quyết định
Triển khai hai **Web Service** (brewlite-web :3000, brewlite-api :4000) từ image GHCR và một **Render PostgreSQL** (Internal Database URL, không public). HTTPS do Render edge xử lý; API bật CORS cho đúng origin của web. Secret đặt trong Render Environment; log ra stdout → Render Logs; health check `GET /health`.

## Phương án đã cân nhắc
- VPS tự quản: linh hoạt nhưng tốn công cấu hình HTTPS, bảo mật, sao lưu.
- Azure/AWS: mạnh nhưng phức tạp và tốn chi phí cho MVP.

## Hệ quả
- Ưu: HTTPS, database bền, hook triển khai sẵn; nhanh để có URL production.
- Nhược: Gói miễn phí có thể ngủ đông và giới hạn hạn mức; cần smoke test và có phương án chuyển sang VPS.
