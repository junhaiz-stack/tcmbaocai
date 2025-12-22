# 阿里云 ECS Docker 部署指南

本文档详细说明如何在阿里云 ECS 服务器上使用 Docker 部署 TCM 供应链管理系统。

## 部署架构

```
用户浏览器
    ↓
Nginx (80/443) - 反向代理 + 静态文件服务
    ↓
┌─────────────┬─────────────┐
│  Frontend   │   Backend    │
│  Container  │  Container   │
└─────────────┴──────┬───────┘
                     ↓
             阿里云 RDS (数据库)
                     ↓
             阿里云 OSS (图片存储)
```

## 一、ECS 服务器准备

### 1.1 购买和配置 ECS 实例

1. 登录阿里云控制台，购买 ECS 实例
2. 推荐配置：
   - CPU: 2核及以上
   - 内存: 4GB 及以上
   - 系统盘: 40GB 及以上
   - 操作系统: Ubuntu 20.04/22.04 或 CentOS 7/8
   - 网络: 公网 IP（用于访问）

### 1.2 安全组配置

在阿里云控制台配置安全组，开放以下端口：

- **80** (HTTP)
- **443** (HTTPS，如使用 SSL)
- **3001** (后端 API，可选，如果只通过 Nginx 访问则不需要)

### 1.3 连接到服务器

```bash
# 使用 SSH 连接到服务器
ssh root@your-server-ip
```

## 二、安装必要软件

### 2.1 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2.2 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 2.3 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

## 三、上传代码到服务器

### 3.1 方式一：使用 Git（推荐）

```bash
# 在服务器上安装 Git
sudo apt install git -y  # Ubuntu/Debian
# 或
sudo yum install git -y  # CentOS/RHEL

# 克隆代码仓库
git clone your-repository-url
cd tcm-supply-chain-link
```

### 3.2 方式二：使用 SCP

```bash
# 在本地机器上执行
scp -r /path/to/tcm-supply-chain-link root@your-server-ip:/opt/
```

### 3.3 方式三：使用压缩包

```bash
# 在本地打包
tar -czf tcm-supply-chain-link.tar.gz tcm-supply-chain-link/

# 上传到服务器
scp tcm-supply-chain-link.tar.gz root@your-server-ip:/opt/

# 在服务器上解压
cd /opt
tar -xzf tcm-supply-chain-link.tar.gz
cd tcm-supply-chain-link
```

## 四、配置环境变量

### 4.1 配置后端环境变量

```bash
# 复制环境变量模板
cp backend/env.production.template backend/.env

# 编辑环境变量文件
nano backend/.env
# 或使用 vim
vim backend/.env
```

### 4.2 填写必要的配置

编辑 `backend/.env` 文件，填写以下配置：

```env
# 数据库配置（阿里云 RDS）
DATABASE_URL="mysql://用户名:密码@rm-xxxxx.mysql.rds.aliyuncs.com:3306/tcm_supply_chain"

# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥（生产环境请使用强密钥）
JWT_SECRET=your-strong-jwt-secret-key-here

# CORS配置（填写您的服务器IP或域名）
CORS_ORIGIN=http://your-server-ip
# 或
CORS_ORIGIN=https://your-domain.com

# 阿里云OSS配置（已配置，确认无误即可）
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=jpgupupup
```

**重要提示：**
- `DATABASE_URL`: 使用阿里云 RDS 的**内网地址**（通常以 `rm-` 开头），这样访问速度更快且不消耗公网流量
- `JWT_SECRET`: 使用强密钥，可以使用以下命令生成：
  ```bash
  openssl rand -base64 32
  ```
- `CORS_ORIGIN`: 如果使用域名，填写 `https://your-domain.com`；如果使用 IP，填写 `http://your-server-ip`

## 五、部署应用

### 5.1 使用部署脚本（推荐）

```bash
# 给部署脚本添加执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 5.2 手动部署

```bash
# 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 六、验证部署

### 6.1 检查服务状态

```bash
# 查看所有容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该看到三个服务都在运行：
# - tcm_backend
# - tcm_frontend
# - tcm_nginx
```

### 6.2 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 检查 Nginx 健康状态
curl http://localhost/health

# 检查前端（通过 Nginx）
curl http://localhost/
```

### 6.3 访问应用

在浏览器中访问：
- **使用 IP**: `http://your-server-ip`
- **使用域名**: `http://your-domain.com`（如果已配置域名解析）

## 七、配置域名和 SSL（可选）

### 7.1 配置域名解析

1. 在域名服务商处添加 A 记录，将域名解析到 ECS 公网 IP
2. 等待 DNS 解析生效（通常几分钟到几小时）

### 7.2 配置 SSL 证书

#### 方式一：使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu/Debian
# 或
sudo yum install certbot python3-certbot-nginx -y  # CentOS/RHEL

# 获取证书（需要先停止 Nginx 容器）
docker-compose -f docker-compose.prod.yml stop nginx

# 申请证书
sudo certbot certonly --standalone -d your-domain.com

# 证书会保存在 /etc/letsencrypt/live/your-domain.com/
```

#### 方式二：使用阿里云 SSL 证书

1. 在阿里云控制台购买或申请免费 SSL 证书
2. 下载证书文件（Nginx 格式）
3. 将证书文件上传到服务器 `nginx/ssl/` 目录

### 7.3 更新 Nginx 配置

编辑 `nginx/nginx.conf`，取消注释 HTTPS 配置部分，并修改：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;  # 修改为您的域名

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

### 7.4 重启 Nginx

```bash
# 重启 Nginx 容器
docker-compose -f docker-compose.prod.yml restart nginx
```

## 八、日常维护

### 8.1 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 8.2 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend
```

### 8.3 更新代码

```bash
# 1. 拉取最新代码（如果使用 Git）
git pull

# 2. 重新构建和部署
./deploy.sh

# 或手动执行
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 8.4 备份数据库

```bash
# 使用 mysqldump 备份（需要安装 MySQL 客户端）
mysqldump -h your-rds-host -u username -p database_name > backup_$(date +%Y%m%d).sql

# 或使用阿里云 RDS 控制台的自动备份功能
```

### 8.5 监控资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

## 九、故障排查

### 9.1 服务无法启动

```bash
# 查看详细错误日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# 检查环境变量是否正确
cat backend/.env

# 检查端口是否被占用
netstat -tulpn | grep 3001
netstat -tulpn | grep 80
```

### 9.2 数据库连接失败

1. 检查 `DATABASE_URL` 配置是否正确
2. 确认阿里云 RDS 白名单中已添加 ECS 内网 IP
3. 测试数据库连接：
   ```bash
   # 安装 MySQL 客户端
   sudo apt install mysql-client -y
   
   # 测试连接
   mysql -h your-rds-host -u username -p
   ```

### 9.3 图片上传失败

1. 检查 OSS 配置是否正确
2. 确认 OSS AccessKey 有上传权限
3. 查看后端日志：
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend | grep OSS
   ```

### 9.4 CORS 错误

1. 检查 `CORS_ORIGIN` 配置是否包含前端访问地址
2. 确认前端请求的 API 地址正确
3. 查看浏览器控制台错误信息

### 9.5 前端无法访问后端 API

1. 检查 Nginx 配置是否正确
2. 确认后端服务正常运行：
   ```bash
   curl http://localhost:3001/health
   ```
3. 检查 Nginx 日志：
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

## 十、安全建议

1. **修改默认密码**: 确保所有默认密码都已修改
2. **使用强密钥**: JWT_SECRET 使用强随机字符串
3. **定期更新**: 定期更新系统和 Docker 镜像
4. **防火墙配置**: 只开放必要的端口
5. **SSL 证书**: 生产环境建议使用 HTTPS
6. **数据库安全**: 
   - 使用强密码
   - 限制数据库访问 IP（通过 RDS 白名单）
   - 定期备份
7. **日志管理**: 定期清理日志文件，避免占用过多磁盘空间

## 十一、性能优化

1. **启用 Gzip**: Nginx 配置中已启用 Gzip 压缩
2. **静态资源缓存**: Nginx 配置中已设置静态资源缓存
3. **数据库连接池**: 确保 Prisma 连接池配置合理
4. **监控和告警**: 建议配置阿里云监控，设置资源使用告警

## 十二、联系支持

如遇到问题，请：
1. 查看本文档的故障排查部分
2. 检查服务日志
3. 联系技术支持

---

**部署完成后，您的应用应该可以通过 `http://your-server-ip` 或 `https://your-domain.com` 访问。**

