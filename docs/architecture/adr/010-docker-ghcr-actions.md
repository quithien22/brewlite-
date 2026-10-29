# ADR-010: Docker, GitHub Container Registry và GitHub Actions cho CI/CD
 
- **Liên quan:** NFR-13, NFR-15, NFR-07

## Bối cảnh
Đề yêu cầu docker-compose chạy local, pipeline CI/CD, image gắn tag, push registry, deploy, smoke test và rollback.

## Quyết định
Đóng gói web và API thành **Docker image**. **CI** (`ci.yml`) chạy khi mở pull request: cài đặt → lint → unit test → build; PR không merge nếu lỗi. **CD** (`cd.yml`) chạy khi push tag hoặc merge nhánh chính: lint, test, build, docker build, push **GHCR** với tag **commit SHA hoặc `vX.Y.Z`**, migrate, deploy bằng secret của CI, smoke test (`GET /health`, `GET /products`). Smoke test lỗi thì dừng pipeline; rollback bằng cách deploy lại image tag trước. Không dùng `:latest` làm nguồn rollback.

## Phương án đã cân nhắc
- Triển khai thủ công: dễ sai, khó lặp lại.
- Dùng registry khác (Docker Hub): cần thêm tài khoản và secret.

## Hệ quả
- Ưu: Tự động và lặp lại được; image truy vết được tới commit.
- Nhược: Phụ thuộc GitHub Actions và hạn mức miễn phí.
