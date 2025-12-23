# 阿里云 ECS 代码更新指南（直接部署版本）

本文档说明如何在阿里云 ECS 服务器上更新代码，从 GitHub 拉取最新更改（直接部署，不使用 Docker）。

## 快速更新（推荐）

### 方法一：使用更新脚本（最简单）

```bash
# 1. SSH 连接到 ECS 服务器
ssh root@172.30.184.197

# 2. 进入项目目录
cd /opt/tcmbaocai

# 3. 如果脚本不存在，先从 GitHub 拉取
git pull origin main

# 4. 给脚本添加执行权限
chmod +x update.sh

# 5. 执行更新脚本
./update.sh
```

更新脚本会自动完成以下操作：
- ✅ 备份当前代码
- ✅ 从 GitHub 拉取最新代码
- ✅ 更新 npm 依赖
- ✅ 重新构建前端和后端
- ✅ 重启服务（PM2/systemd）
- ✅ 重新加载 Nginx
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

# 查看服务状态（如果使用 PM2）
pm2 list

# 或查看 systemd 服务状态
systemctl status tcm-backend
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

### 步骤 5: 更新后端依赖并构建

```bash
# 进入后端目录
cd backend

# 安装依赖（如果需要）
npm install

# 生成 Prisma Client
npx prisma generate

# 构建后端
npm run build
```

### 步骤 6: 更新前端依赖并构建

```bash
# 返回项目根目录
cd ..

# 安装前端依赖（如果需要）
npm install

# 构建前端
npm run build
```

### 步骤 7: 重启后端服务

**如果使用 PM2：**
```bash
# 重启后端进程
pm2 restart tcm-backend

# 或重启所有进程
pm2 restart all

# 查看状态
pm2 status
```

**如果使用 systemd：**
```bash
# 重启服务
systemctl restart tcm-backend

# 查看状态
systemctl status tcm-backend
```

**如果直接运行：**
```bash
# 停止旧进程（找到进程ID）
ps aux | grep "node.*backend"

# 杀死进程
kill <PID>

# 启动新进程
cd backend
npm start &
```

### 步骤 8: 重新加载 Nginx

```bash
# 重新加载 Nginx 配置
nginx -s reload

# 或使用 systemctl
systemctl reload nginx
```

### 步骤 9: 验证更新

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 检查 Nginx 健康状态
curl http://localhost/health

# 查看后端日志（PM2）
pm2 logs tcm-backend

# 或查看 systemd 日志
journalctl -u tcm-backend -f
```

---

## 仅更新代码（不重新构建）

如果只是更新了代码，没有修改依赖，可以只重启服务：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 重启后端服务
pm2 restart tcm-backend
# 或
systemctl restart tcm-backend

# 重新加载 Nginx
nginx -s reload
```

**注意：** 这种方式只适用于：
- 仅修改了代码文件
- 没有修改 `package.json` 或依赖
- 后端代码已编译（TypeScript → JavaScript）

---

## 仅更新前端

如果只更新了前端代码：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 安装依赖（如果需要）
npm install

# 重新构建前端
npm run build

# 重新加载 Nginx（前端是静态文件，由 Nginx 服务）
nginx -s reload
```

---

## 仅更新后端

如果只更新了后端代码：

```bash
cd /opt/tcmbaocai

# 拉取最新代码
git pull origin main

# 进入后端目录
cd backend

# 安装依赖（如果需要）
npm install

# 生成 Prisma Client（如果数据库 schema 有变化）
npx prisma generate

# 重新构建后端
npm run build

# 重启后端服务
pm2 restart tcm-backend
# 或
systemctl restart tcm-backend
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

### 问题 2: npm install 失败

**排查：**
```bash
# 检查 Node.js 和 npm 版本
node --version
npm --version

# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 3: 构建失败

**排查：**
```bash
# 查看详细错误信息
npm run build 2>&1 | tee build.log

# 检查磁盘空间
df -h

# 检查内存
free -h

# 清理未使用的包
npm prune
```

### 问题 4: 服务启动失败

**排查：**
```bash
# 查看 PM2 日志
pm2 logs tcm-backend

# 查看 systemd 日志
journalctl -u tcm-backend -n 50

# 检查环境变量文件
cat backend/.env

# 检查端口占用
netstat -tulpn | grep 3001
lsof -i :3001
```

### 问题 5: 服务无法访问

**排查：**
```bash
# 检查服务状态
pm2 status
# 或
systemctl status tcm-backend

# 检查端口监听
netstat -tulpn | grep 3001
netstat -tulpn | grep 80

# 检查防火墙
iptables -L -n
firewall-cmd --list-all  # CentOS/RHEL
ufw status  # Ubuntu/Debian

# 检查 Nginx 配置
nginx -t
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
cd backend
npm install
npx prisma generate
npm run build
pm2 restart tcm-backend

cd ..
npm install
npm run build
nginx -s reload
```

---

## 自动化更新（可选）

可以设置定时任务自动更新：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 2 点自动更新）
0 2 * * * cd /opt/tcmbaocai && /bin/bash ./update.sh >> /var/log/tcm-update.log 2>&1
```

**注意：** 自动更新前请确保：
- 更新脚本有执行权限：`chmod +x update.sh`
- 日志目录存在：`mkdir -p /var/log`
- 测试脚本可以正常运行

---

**更新完成后，建议在浏览器中测试应用功能，确保一切正常！**

