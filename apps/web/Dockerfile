FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
# lock file chưa khớp package.json (thiếu zustand) thì tự cài lại
RUN npm ci || npm install

COPY . .

# NEXT_PUBLIC_* được nhúng vào bundle lúc build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
