# ==============================================================================
# Multi-stage Dockerfile cho Frontend React SPA (Production Build)
# ==============================================================================

# Stage 1: Build mã nguồn bằng Node.js 20
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Nginx Web Server siêu nhẹ
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
