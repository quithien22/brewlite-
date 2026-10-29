# ADR-001: Dùng một repository (monorepo) cho web, API và tài liệu

- **Liên quan:** NFR-13, NFR-15, NFR-19

## Bối cảnh
Đề yêu cầu cấu trúc apps/web, apps/api, docs và truy vết yêu cầu → thiết kế → code → test. Tài liệu, sơ đồ và mã nguồn thay đổi cùng nhau.

## Quyết định
Dùng **một repository** với cấu trúc `apps/web`, `apps/api`, `docs`, `tests`, `.github/workflows`. Tài liệu và code sửa trong cùng pull request.

## Phương án đã cân nhắc
- Nhiều repository (web, api, docs tách riêng): khó giữ tài liệu khớp code, khó truy vết.

## Hệ quả
- Ưu: Một PR sửa được cả code và tài liệu; CI chạy một nơi.
- Ưu: Dễ clone và chạy theo README.
- Nhược: Repository lớn dần; CI cần chạy có điều kiện nếu sau này tách pipeline.
