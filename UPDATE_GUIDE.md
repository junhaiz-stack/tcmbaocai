# 阿里云 ECS 代码更新指南

本文档说明如何在阿里云 ECS 服务器上更新代码，从 GitHub 拉取最新更改。

## 快速更新（推荐）

### 方法一：使用更新脚本（最简单）

```bash
# 1. SSH 连接到 ECS 服务器
ssh root@172.30.184.197

# 2. 进入项目目录
cd /opt/tcmbaocai

# 3. 如果脚本不存在，先下载或创建
# 可以从 GitHub 拉取，或使用以下命令创建
cat > update.sh << 'EOF'
# ... (脚本内容)
EOF
chmod +x update.sh

# 4. 执行更新脚本
./update.sh
```

更新脚本会自动完成以下操作：
- ✅ 备份当前代码
- ✅ 从 GitHub 拉取最新代码
- ✅ 重新构建 Docker 镜像
- ✅ 重启容器
- ✅ 执行健康检查

---

## 手动更新步骤

如果不想使用脚本，可以手动执行以下步骤：

### 步骤 1: 连接到 ECS 服务器

```bash
ssh root@172.30.184.197
```

### 步骤 2: 进入项目目录

```bash
cd /opt/tcmbaocai
```

### 步骤 3: 检查当前状态

```bash
# 查看当前分支和提交
git branch
git log -1 --oneline

# 查看容器状态
docker ps
```

### 步骤 4: 拉取最新代码

```bash
# 如果有未提交的更改，先暂存
git stash

# 拉取最新代码
git pull origin main

# 查看更新内容
git log --oneline -5
```

### 步骤 5: 重新构建后端镜像

```bash
# 构建后端镜像（需要 5-10 分钟）
docker build -t tcm-backend ./backend
```

### 步骤 6: 重新构建前端镜像

```bash
# 构建前端镜像（需要 5-10 分钟）
docker build -t tcm-frontend .
```

### 步骤 7: 重启后端容器

```bash
# 停止并删除旧容器
docker stop tcm_backend
docker rm tcm_backend

# 启动新容器
docker run -d --name tcm_backend \
  -p 3001:3001 \
  --env-file ./backend/.env \
  --network tcm_network \
  --restart unless-stopped \
  tcm-backend
```

### 步骤 8: 重启前端容器

```bash
# 停止并删除旧容器
docker stop tcm_frontend
docker rm tcm_frontend

# 启动新容器
docker run -d --name tcm_frontend \
  --network tcm_network \
  --restart unless-stopped \
  tcm-frontend
```

### 步骤 9: 验证更新

```bash
# 检查容器状态
docker ps

# 检查后端健康状态
curl http://localhost:3001/health

# 检查 Nginx 健康状态
curl http://localhost/health

# 查看后端日志
docker logs -f tcm_backend
```

---

## 仅更新代码（不重建镜像）

如果只是更新了代码，没有修改依赖或配置，可以只重启容器：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 重启容器（会使用现有镜像）
docker restart tcm_backend tcm_frontend
```

**注意：** 这种方式只适用于：
- 仅修改了代码文件
- 没有修改 `package.json`、`Dockerfile` 或环境变量
- 前端是静态文件，需要重新构建

---

## 仅更新前端

如果只更新了前端代码：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 重新构建前端镜像
docker build -t tcm-frontend .

# 重启前端容器
docker stop tcm_frontend
docker rm tcm_frontend
docker run -d --name tcm_frontend \
  --network tcm_network \
  --restart unless-stopped \
  tcm-frontend
```

---

## 仅更新后端

如果只更新了后端代码：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 重新构建后端镜像
docker build -t tcm-backend ./backend

# 重启后端容器
docker stop tcm_backend
docker rm tcm_backend
docker run -d --name tcm_backend \
  -p 3001:3001 \
  --env-file ./backend/.env \
  --network tcm_network \
  --restart unless-stopped \
  tcm-backend
```

---

## 常见问题

### 问题 1: Git pull 失败

**错误：** `Permission denied` 或 `Authentication failed`

**解决：**
```bash
# 检查 Git 配置
git config --list

# 如果是私有仓库，可能需要配置访问令牌
# 或者使用 SSH 密钥
```

### 问题 2: Docker 构建失败

**排查：**
```bash
# 查看详细构建日志
docker build -t tcm-backend ./backend --no-cache

# 检查磁盘空间
df -h

# 清理未使用的镜像
docker system prune -a
```

### 问题 3: 容器启动失败

**排查：**
```bash
# 查看容器日志
docker logs tcm_backend

# 检查环境变量文件
cat backend/.env

# 检查网络
docker network inspect tcm_network
```

### 问题 4: 服务无法访问

**排查：**
```bash
# 检查容器状态
docker ps -a

# 检查端口占用
netstat -tulpn | grep 3001
netstat -tulpn | grep 80

# 检查防火墙
iptables -L -n
```

---

## 更新前检查清单

- [ ] 已备份重要数据
- [ ] 已检查 GitHub 仓库是否有新提交
- [ ] 已确认更新内容（查看 commit 信息）
- [ ] 已检查磁盘空间是否充足
- [ ] 已确认 Docker 服务正常运行
- [ ] 已确认数据库连接正常

---

## 更新后验证清单

- [ ] 所有容器正常运行（`docker ps`）
- [ ] 后端健康检查通过（`curl http://localhost:3001/health`）
- [ ] Nginx 健康检查通过（`curl http://localhost/health`）
- [ ] 浏览器可以正常访问应用
- [ ] 登录功能正常
- [ ] 主要功能模块正常

---

## 回滚到之前的版本

如果更新后出现问题，可以回滚：

```bash
cd /opt/tcmbaocai

# 查看提交历史
git log --oneline -10

# 回滚到指定提交（例如：abc1234）
git reset --hard abc1234

# 重新构建和重启（参考上面的步骤）
docker build -t tcm-backend ./backend
docker build -t tcm-frontend .
# ... 重启容器
```

---

## 自动化更新（可选）

可以设置定时任务自动更新：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 2 点自动更新）
0 2 * * * cd /opt/tcmbaocai && ./update.sh >> /var/log/tcm-update.log 2>&1
```

---

**更新完成后，建议在浏览器中测试应用功能，确保一切正常！**

