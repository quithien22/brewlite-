# ADR-004: Xác thực bằng JWT, mật khẩu băm bcrypt

- **Liên quan:** FR-01, FR-02, FR-03, NFR-04, NFR-06, NFR-07

## Bối cảnh
Web app Next.js (PWA) gọi API qua trình duyệt; cần xác thực đơn giản, không lưu phiên phía máy chủ.

## Quyết định
Đăng nhập trả **JWT** có thời hạn (`JWT_EXPIRES_IN`) chứa `sub` và `email`; client gửi trong header `Authorization: Bearer`. Mật khẩu lưu dạng **bcrypt**. `JwtAuthGuard` bảo vệ mọi API riêng tư; khách chỉ truy cập dữ liệu của chính mình. `JWT_SECRET` đặt qua biến môi trường.

## Phương án đã cân nhắc
- Session lưu ở máy chủ: cần kho phiên, khó mở rộng.
- OAuth/đăng nhập bên thứ ba: ngoài phạm vi MVP.

## Hệ quả
- Ưu: Stateless, dễ triển khai và mở rộng.
- Nhược: Khó thu hồi token trước hạn; giảm rủi ro bằng thời hạn ngắn.
- Nhược: Token lưu ở trình duyệt, cần chú ý chống XSS.
