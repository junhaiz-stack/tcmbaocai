# 阿里云 ECS 完整部署 - 详细操作步骤

本文档提供在阿里云 ECS 服务器上部署 TCM 供应链管理系统的每一步具体操作命令。

## 前提条件

- 阿里云 ECS 服务器 IP: `172.30.184.197`
- 已配置阿里云 RDS 数据库
- 已配置阿里云 OSS 存储
- 代码仓库: `https://github.com/junhaiz-stack/tcmbaocai.git`

---

## 阶段一：服务器环境准备

### 步骤 1: 连接 ECS 服务器

**操作：** 在本地终端执行

```bash
ssh root@172.30.184.197
```

**说明：** 首次连接会提示确认主机，输入 `yes` 继续。

---

### 步骤 2: 检查系统环境

**操作：** 在服务器上执行

```bash
# 查看系统信息
uname -a

# 查看当前用户
whoami

# 查看内网 IP（用于配置 CORS）
hostname -I | awk '{print $1}'
```

**预期输出：** 显示系统版本、当前用户和内网 IP 地址。

---

### 步骤 3: 安装 Git

**操作：** 在服务器上执行

```bash
# 检查 Git 是否已安装
git --version

# 如果未安装，根据系统类型安装
# CentOS/RHEL/Alibaba Cloud Linux:
yum install -y git

# Ubuntu/Debian:
# apt-get update && apt-get install -y git
```

**验证：**
```bash
git --version
```

---

### 步骤 4: 安装 Docker

**操作：** 在服务器上执行

```bash
# 检查 Docker 是否已安装
docker --version

# 如果未安装，执行以下命令
# CentOS/RHEL/Alibaba Cloud Linux:
yum install -y yum-utils
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务
systemctl start docker
systemctl enable docker
```

**验证：**
```bash
docker --version
systemctl status docker
```

---

### 步骤 5: 安装 Docker Compose

**操作：** 在服务器上执行

```bash
# 检查 Docker Compose 是否已安装
docker-compose --version

# 如果未安装，下载并安装
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH="amd64" || ARCH="arm64"

# 使用国内镜像下载（推荐）
curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-${ARCH}" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose
```

**验证：**
```bash
docker-compose --version
```

---

### 步骤 6: 配置安全组（在阿里云控制台操作）

**操作：** 登录阿里云控制台

1. 进入 **ECS 控制台** → **实例**
2. 找到您的实例，点击 **安全组**
3. 点击 **配置规则**
4. 添加以下入站规则：

| 规则 | 协议 | 端口 | 授权对象 | 描述 |
|------|------|------|----------|------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Web 访问 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS 访问（可选）|

**验证：** 在本地测试端口是否开放
```bash
# Windows PowerShell
Test-NetConnection -ComputerName 172.30.184.197 -Port 80
```

---

## 阶段二：代码部署

### 步骤 7: 克隆代码仓库

**操作：** 在服务器上执行

```bash
# 创建项目目录
mkdir -p /opt
cd /opt

# 克隆代码（如果仓库是私有的，需要配置访问令牌）
git clone https://github.com/junhaiz-stack/tcmbaocai.git

# 进入项目目录
cd tcmbaocai
```

**如果克隆失败（私有仓库）：**

```bash
# 使用个人访问令牌克隆
# 格式: https://YOUR_TOKEN@github.com/junhaiz-stack/tcmbaocai.git
git clone https://YOUR_TOKEN@github.com/junhaiz-stack/tcmbaocai.git
```

**验证：**
```bash
ls -la /opt/tcmbaocai
```

---

### 步骤 8: 配置环境变量

**操作：** 在服务器上执行

```bash
cd /opt/tcmbaocai

# 从模板创建 .env 文件
cp backend/env.production.template backend/.env

# 编辑 .env 文件
vi backend/.env
# 或使用 nano
# nano backend/.env
```

**在编辑器中填写以下配置：**

```env
# 数据库配置（阿里云 RDS）
# 注意：值不要加引号！
DATABASE_URL=mysql://用户名:密码@RDS地址:3306/tcm_supply_chain
# 密码中的特殊字符需要 URL 编码：
# ^ = %5E, * = %2A, @ = %40, + = %2B, % = %25

# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥（生成强密钥）
JWT_SECRET=your-strong-jwt-secret-key-here
# 生成命令: openssl rand -base64 32

# CORS配置（使用服务器 IP）
CORS_ORIGIN=http://172.30.184.197

# 阿里云OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=jpgupupup
```

**vi 编辑器使用：**
- 按 `i` 进入编辑模式
- 修改内容
- 按 `Esc` 退出编辑模式
- 输入 `:wq` 保存并退出

**验证配置：**
```bash
# 检查 .env 文件（隐藏敏感信息）
cat backend/.env | grep -v "^#" | grep -v "^$"

# 确认 DATABASE_URL 没有引号
grep DATABASE_URL backend/.env
```

---

### 步骤 9: 生成 JWT 密钥（可选）

**操作：** 在服务器上执行

```bash
# 生成强密钥
openssl rand -base64 32

# 将输出的密钥复制到 backend/.env 的 JWT_SECRET 字段
```

---

## 阶段三：Docker 构建

### 步骤 10: 构建后端镜像

**操作：** 在服务器上执行

```bash
cd /opt/tcmbaocai

# 检查 Dockerfile 是否存在
ls -la backend/Dockerfile

# 构建后端镜像（需要 5-10 分钟）
docker build -t tcm-backend ./backend
```

**构建过程说明：**
- 会下载基础镜像（node:18-alpine）
- 安装 OpenSSL 库
- 安装 npm 依赖
- 生成 Prisma Client
- 编译 TypeScript 代码

**验证：**
```bash
# 查看构建的镜像
docker images | grep tcm-backend
```

---

### 步骤 11: 构建前端镜像

**操作：** 在服务器上执行

```bash
cd /opt/tcmbaocai

# 构建前端镜像（需要 5-10 分钟）
docker build -t tcm-frontend .
```

**验证：**
```bash
# 查看构建的镜像
docker images | grep tcm-frontend
```

---

## 阶段四：容器部署

### 步骤 12: 清理旧容器（如果存在）

**操作：** 在服务器上执行

```bash
# 停止并删除旧容器
docker stop tcm_backend tcm_frontend tcm_nginx 2>/dev/null
docker rm tcm_backend tcm_frontend tcm_nginx 2>/dev/null
```

---

### 步骤 13: 创建 Docker 网络

**操作：** 在服务器上执行

```bash
# 创建网络
docker network create tcm_network

# 验证网络
docker network ls | grep tcm_network
```

---

### 步骤 14: 启动后端容器

**操作：** 在服务器上执行

```bash
cd /opt/tcmbaocai

# 启动后端容器
docker run -d --name tcm_backend \
  -p 3001:3001 \
  --env-file ./backend/.env \
  --network tcm_network \
  --restart unless-stopped \
  tcm-backend
```

**验证：**
```bash
# 查看容器状态
docker ps | grep tcm_backend

# 查看日志
docker logs tcm_backend

# 等待后端启动（最多 30 秒）
for i in {1..15}; do
  if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "后端已就绪"
    break
  fi
  echo "等待后端启动... ($i/15)"
  sleep 2
done
```

---

### 步骤 15: 启动前端容器

**操作：** 在服务器上执行

```bash
# 启动前端容器
docker run -d --name tcm_frontend \
  --network tcm_network \
  --restart unless-stopped \
  tcm-frontend
```

**验证：**
```bash
docker ps | grep tcm_frontend
```

---

### 步骤 16: 启动 Nginx 容器

**操作：** 在服务器上执行

```bash
cd /opt/tcmbaocai

# 检查 Nginx 配置文件
ls -la nginx/nginx.conf

# 启动 Nginx 容器
docker run -d --name tcm_nginx \
  -p 80:80 \
  -v /opt/tcmbaocai/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  --network tcm_network \
  --restart unless-stopped \
  nginx:alpine
```

**验证：**
```bash
docker ps | grep tcm_nginx
```

---

## 阶段五：验证和测试

### 步骤 17: 检查所有容器状态

**操作：** 在服务器上执行

```bash
# 查看所有容器
docker ps

# 应该看到三个容器都在运行：
# - tcm_backend
# - tcm_frontend
# - tcm_nginx
```

---

### 步骤 18: 测试后端健康检查

**操作：** 在服务器上执行

```bash
# 测试后端健康端点
curl http://localhost:3001/health

# 预期输出: {"status":"ok","timestamp":"..."}
```

---

### 步骤 19: 测试 Nginx 健康检查

**操作：** 在服务器上执行

```bash
# 测试 Nginx 健康端点
curl http://localhost/health

# 预期输出: healthy
```

---

### 步骤 20: 测试前端访问

**操作：** 在服务器上执行

```bash
# 测试前端页面
curl http://localhost/

# 应该返回 HTML 内容
```

---

### 步骤 21: 在浏览器中访问

**操作：** 在本地浏览器中打开

```
http://172.30.184.197
```

**预期结果：** 看到登录页面，可以正常使用系统。

---

## 一键部署脚本（推荐）

如果不想手动执行每个步骤，可以使用一键部署脚本：

```bash
# 在服务器上执行
cd /opt/tcmbaocai

# 使用部署脚本（如果已上传）
chmod +x deploy-full.sh
./deploy-full.sh
```

---

## 常见问题排查

### 问题 1: 容器一直重启

**排查：**
```bash
# 查看容器日志
docker logs tcm_backend

# 查看最后 50 行日志
docker logs --tail 50 tcm_backend
```

**常见原因：**
- 数据库连接失败（检查 RDS 白名单）
- 环境变量配置错误
- OpenSSL 库缺失（已修复）

---

### 问题 2: 无法访问应用

**排查：**
```bash
# 检查容器状态
docker ps

# 检查端口监听
netstat -tulpn | grep 80
netstat -tulpn | grep 3001

# 检查安全组配置（在阿里云控制台）
```

---

### 问题 3: 数据库连接失败

**排查：**
```bash
# 检查 .env 文件
cat backend/.env | grep DATABASE_URL

# 确认 RDS 白名单已添加 ECS 内网 IP
# ECS 内网 IP: 172.30.184.197
```

**解决：** 在阿里云 RDS 控制台添加白名单。

---

### 问题 4: Nginx 无法找到后端

**排查：**
```bash
# 检查网络
docker network inspect tcm_network

# 检查后端容器是否在同一网络
docker inspect tcm_backend | grep NetworkMode
```

---

## 维护命令

### 查看日志
```bash
# 后端日志
docker logs -f tcm_backend

# 前端日志
docker logs -f tcm_frontend

# Nginx 日志
docker logs -f tcm_nginx
```

### 重启服务
```bash
# 重启单个容器
docker restart tcm_backend

# 重启所有容器
docker restart tcm_backend tcm_frontend tcm_nginx
```

### 更新代码
```bash
cd /opt/tcmbaocai
git pull origin main

# 重新构建镜像
docker build -t tcm-backend ./backend
docker build -t tcm-frontend .

# 重启容器
docker restart tcm_backend tcm_frontend
```

### 停止服务
```bash
docker stop tcm_backend tcm_frontend tcm_nginx
```

### 删除所有容器和网络
```bash
docker stop tcm_backend tcm_frontend tcm_nginx
docker rm tcm_backend tcm_frontend tcm_nginx
docker network rm tcm_network
```

---

## 部署完成检查清单

- [ ] Git 已安装
- [ ] Docker 已安装并运行
- [ ] Docker Compose 已安装
- [ ] 安全组已开放端口 80
- [ ] 代码已克隆到 /opt/tcmbaocai
- [ ] backend/.env 文件已配置
- [ ] 后端镜像构建成功
- [ ] 前端镜像构建成功
- [ ] 后端容器运行正常
- [ ] 前端容器运行正常
- [ ] Nginx 容器运行正常
- [ ] 后端健康检查通过
- [ ] Nginx 健康检查通过
- [ ] 浏览器可以访问应用

---

**部署完成后，您的应用应该可以通过 `http://172.30.184.197` 访问！**

