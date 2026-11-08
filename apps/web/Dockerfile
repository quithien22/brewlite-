FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
# lock file chưa khớp package.json (thiếu zustand) thì tự cài lại
RUN npm ci || npm install

COPY . .

# NEXT_PUBLIC_* được nhúng vào bundle lúc build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Bật checkbox "Chế độ demo" (mô phỏng thanh toán thất bại) trong bản build production
ARG NEXT_PUBLIC_ALLOW_MOCK_FAILURE=false
ENV NEXT_PUBLIC_ALLOW_MOCK_FAILURE=$NEXT_PUBLIC_ALLOW_MOCK_FAILURE

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
