# syntax=docker/dockerfile:1

# ---------- 1. deps: chỉ cài node_modules, tách riêng để cache theo lockfile ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- 2. builder: build Next ra output standalone ----------
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ★ API_BASE_URL phải có mặt LÚC BUILD, không chỉ lúc chạy.
# `rewrites()` trong next.config.ts được Next gọi khi build và ghi kết quả vào
# routes-manifest / required-server-files; server standalone đọc lại bản đã ghi
# đó. Chỉ đặt biến lúc chạy container thì proxy /api vẫn trỏ về giá trị mặc định
# (http://localhost:8000) — bên trong container đó chính là container này, nên
# mọi request API sẽ "connection refused" mà không có lỗi build nào báo trước.
#
# Trong docker compose, backend nằm ở hostname `api` (tên service), không phải localhost.
ARG API_BASE_URL=http://localhost:8000
ENV API_BASE_URL=$API_BASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. runner: image chạy thật, không chứa source lẫn devDependencies ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Giữ lại ở tầng runner cho dễ đọc `docker inspect`; giá trị thật đã nằm trong
# bản build ở trên.
ARG API_BASE_URL=http://localhost:8000
ENV API_BASE_URL=$API_BASE_URL

# Chạy bằng user thường, không phải root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# `standalone` đã gói sẵn server.js + đúng phần node_modules cần thiết.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
