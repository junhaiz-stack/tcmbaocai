FROM node:18-alpine

WORKDIR /app

# 使用国内镜像源（阿里云）加速包下载
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装 OpenSSL 库（Prisma 需要）
# Alpine 3.21+ 使用 openssl 包，并创建符号链接以兼容 Prisma
RUN apk add --no-cache openssl && \
    ln -s /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 2>/dev/null || true && \
    ln -s /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 2>/dev/null || true

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 删除 devDependencies 以减小镜像大小
RUN npm prune --production

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["npm", "start"]


