# 部署指南

## 一、本地开发环境搭建

### 1. 前端开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE_URL=http://localhost:3001/api

# 启动开发服务器
npm run dev
```

### 2. 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，配置数据库连接

# 初始化数据库
npm run db:generate
npm run db:migrate
npm run db:seed

# 启动开发服务器
npm run dev
```

## 二、数据库设置

### 选项A：使用 Docker（推荐开发环境）

```bash
# 启动 MySQL
docker run --name tcm_mysql \
  -e MYSQL_DATABASE=tcm_supply_chain \
  -e MYSQL_USER=tcm_user \
  -e MYSQL_PASSWORD=tcm_password \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -p 3306:3306 \
  -d mysql:8.0
```

### 选项B：本地安装 MySQL

1. 下载安装 MySQL：https://dev.mysql.com/downloads/mysql/
2. 创建数据库：
```sql
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tcm_user'@'localhost' IDENTIFIED BY 'tcm_password';
GRANT ALL PRIVILEGES ON tcm_supply_chain.* TO 'tcm_user'@'localhost';
FLUSH PRIVILEGES;
```

## 三、使用 Docker Compose 一键部署

```bash
# 启动所有服务（数据库 + 后端）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 四、生产环境部署

### 1. 前端部署

#### 选项A：静态托管（Vercel/Netlify）

```bash
# 构建
npm run build

# 将 dist/ 目录部署到静态托管服务
```

#### 选项B：Nginx 部署

```bash
# 构建
npm run build

# 复制到服务器
scp -r dist/* user@server:/var/www/tcm-frontend/

# Nginx 配置
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tcm-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 后端部署

#### 选项A：PM2 部署

```bash
# 在服务器上
cd backend
npm install --production
npm run build

# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name tcm-api

# 设置开机自启
pm2 startup
pm2 save
```

#### 选项B：Docker 部署

```bash
# 构建镜像
docker build -t tcm-backend ./backend

# 运行容器
docker run -d \
  --name tcm-backend \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/tcm_supply_chain \
  --link tcm_db:db \
  tcm-backend
```

### 3. 数据库部署

#### 选项A：云数据库（推荐）

- 阿里云 RDS MySQL
- 腾讯云 CDB MySQL
- AWS RDS MySQL

#### 选项B：自建数据库

```bash
# 在服务器上安装 MySQL
sudo apt-get install mysql-server

# 配置数据库
sudo mysql
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tcm_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON tcm_supply_chain.* TO 'tcm_user'@'localhost';
FLUSH PRIVILEGES;
```

## 五、环境变量配置

### 前端生产环境 (.env.production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 后端生产环境 (.env)

```env
DATABASE_URL=mysql://user:password@db-host:3306/tcm_supply_chain
PORT=3001
NODE_ENV=production
JWT_SECRET=your-strong-secret-key
CORS_ORIGIN=https://yourdomain.com
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/...
```

## 六、域名和 HTTPS

1. 购买域名并解析到服务器IP
2. 使用 Let's Encrypt 免费SSL证书：
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 七、监控和维护

### 日志查看

```bash
# PM2 日志
pm2 logs tcm-api

# Docker 日志
docker logs tcm-backend
```

### 数据库备份

```bash
# 备份
mysqldump -u tcm_user -p tcm_supply_chain > backup.sql

# 恢复
mysql -u tcm_user -p tcm_supply_chain < backup.sql
```

### 性能监控

推荐使用：
- PM2 Plus（PM2监控）
- New Relic
- 阿里云/腾讯云监控

## 八、常见问题

### 1. 数据库连接失败

- 检查 DATABASE_URL 配置
- 确认数据库服务已启动
- 检查防火墙设置

### 2. CORS 错误

- 检查后端 CORS_ORIGIN 配置
- 确保前端域名在允许列表中

### 3. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3001
# 或
netstat -tulpn | grep 3001
```


