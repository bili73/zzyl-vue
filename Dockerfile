# 前端Dockerfile - 多阶段构建
# 阶段一：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（利用Docker缓存）
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 阶段二：运行阶段（使用Nginx）
FROM nginx:alpine

# 设置时区
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义nginx配置
COPY docker/nginx.conf /etc/nginx/conf.d/

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 修改权限
RUN chmod -R 755 /usr/share/nginx/html/

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 启动nginx（使用前台运行）
CMD ["nginx", "-g", "daemon off;"]