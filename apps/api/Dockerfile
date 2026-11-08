FROM node:22-slim

# Prisma cần OpenSSL
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
# package-lock.json được sinh ra sau lần `npm install` đầu tiên; nếu chưa khớp thì tự cài lại
RUN npm ci || npm install

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Chạy migration (không dùng db push) -> nạp dữ liệu mẫu (idempotent) -> chạy API
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
