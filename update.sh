#!/bin/bash

# 阿里云 ECS 代码更新脚本（直接部署版本）
# 用于从 GitHub 拉取最新代码并更新应用

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 项目目录（根据实际情况修改）
PROJECT_DIR="/opt/tcmbaocai"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

# 检查是否在项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "项目目录不存在: $PROJECT_DIR"
    print_info "请先克隆项目: git clone https://github.com/junhaiz-stack/tcmbaocai.git $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# 步骤 1: 备份当前代码（可选）
print_step "1. 备份当前代码..."
BACKUP_DIR="/opt/tcmbaocai_backup_$(date +%Y%m%d_%H%M%S)"
if [ -d "$PROJECT_DIR" ]; then
    print_info "创建备份目录: $BACKUP_DIR"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR" 2>/dev/null || print_warn "备份失败，继续执行..."
fi

# 步骤 2: 拉取最新代码
print_step "2. 从 GitHub 拉取最新代码..."
print_info "当前分支: $(git branch --show-current)"
print_info "当前提交: $(git rev-parse --short HEAD)"

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    print_warn "检测到未提交的更改，正在暂存..."
    git stash save "Auto stash before update $(date +%Y%m%d_%H%M%S)"
fi

# 拉取最新代码
print_info "执行 git pull..."
if git pull origin main; then
    print_info "✓ 代码拉取成功"
    print_info "最新提交: $(git rev-parse --short HEAD)"
    print_info "最新提交信息: $(git log -1 --pretty=format:'%s')"
else
    print_error "代码拉取失败"
    exit 1
fi

# 步骤 3: 检查是否有更新
CURRENT_COMMIT=$(git rev-parse HEAD)
if [ -f "$PROJECT_DIR/.last_update_commit" ]; then
    LAST_COMMIT=$(cat "$PROJECT_DIR/.last_update_commit")
    if [ "$CURRENT_COMMIT" = "$LAST_COMMIT" ]; then
        print_warn "代码已是最新版本，无需更新"
        exit 0
    fi
fi

# 步骤 4: 检查 Node.js 和 npm
print_step "3. 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    print_error "npm 未安装，请先安装 npm"
    exit 1
fi
print_info "Node.js 版本: $(node --version)"
print_info "npm 版本: $(npm --version)"

# 步骤 5: 更新后端依赖
print_step "4. 更新后端依赖..."
cd "$BACKEND_DIR"
print_info "安装后端依赖（这可能需要几分钟）..."
if npm install --production=false; then
    print_info "✓ 后端依赖安装成功"
else
    print_error "后端依赖安装失败"
    exit 1
fi

# 步骤 6: 生成 Prisma Client
print_step "5. 生成 Prisma Client..."
if npx prisma generate; then
    print_info "✓ Prisma Client 生成成功"
else
    print_error "Prisma Client 生成失败"
    exit 1
fi

# 步骤 7: 构建后端
print_step "6. 构建后端..."
if npm run build; then
    print_info "✓ 后端构建成功"
else
    print_error "后端构建失败"
    exit 1
fi

# 步骤 8: 更新前端依赖
print_step "7. 更新前端依赖..."
cd "$FRONTEND_DIR"
print_info "安装前端依赖（这可能需要几分钟）..."
if npm install; then
    print_info "✓ 前端依赖安装成功"
else
    print_error "前端依赖安装失败"
    exit 1
fi

# 步骤 9: 构建前端
print_step "8. 构建前端..."
if npm run build; then
    print_info "✓ 前端构建成功"
else
    print_error "前端构建失败"
    exit 1
fi

# 步骤 10: 重启后端服务
print_step "9. 重启后端服务..."

# 检查是否使用 PM2
if command -v pm2 &> /dev/null; then
    print_info "检测到 PM2，使用 PM2 重启后端..."
    if pm2 list | grep -q "tcm-backend\|backend"; then
        print_info "重启 PM2 后端进程..."
        pm2 restart tcm-backend 2>/dev/null || pm2 restart backend 2>/dev/null || pm2 restart all
    else
        print_warn "未找到 PM2 后端进程，请手动启动"
    fi
# 检查是否使用 systemd
elif systemctl list-units --type=service | grep -q "tcm-backend\|tcm-backend.service"; then
    print_info "检测到 systemd 服务，重启后端服务..."
    systemctl restart tcm-backend 2>/dev/null || systemctl restart tcm-backend.service
# 检查是否有启动脚本
elif [ -f "$BACKEND_DIR/start.sh" ]; then
    print_info "使用启动脚本重启后端..."
    cd "$BACKEND_DIR"
    ./start.sh restart
else
    print_warn "未检测到进程管理器，请手动重启后端服务"
    print_info "后端启动命令: cd $BACKEND_DIR && npm start"
fi

# 步骤 11: 重启 Nginx（如果需要）
print_step "10. 重启 Nginx..."
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        print_info "重新加载 Nginx 配置..."
        nginx -s reload 2>/dev/null || systemctl reload nginx
        print_info "✓ Nginx 已重新加载"
    else
        print_warn "Nginx 未运行"
    fi
else
    print_warn "Nginx 未安装或未找到"
fi

# 步骤 12: 等待服务启动
print_step "11. 等待服务启动..."
sleep 5

# 步骤 13: 健康检查
print_step "12. 执行健康检查..."

# 检查后端
print_info "检查后端服务..."
for i in {1..15}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_info "✓ 后端服务健康"
        break
    fi
    if [ $i -eq 15 ]; then
        print_warn "✗ 后端服务可能未就绪，请检查日志"
    else
        echo -n "."
        sleep 2
    fi
done

# 检查 Nginx
print_info "检查 Nginx 服务..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_info "✓ Nginx 服务健康"
else
    print_warn "✗ Nginx 服务可能未就绪"
fi

# 步骤 14: 保存更新记录
echo "$CURRENT_COMMIT" > "$PROJECT_DIR/.last_update_commit"

# 步骤 15: 显示服务状态
print_step "13. 当前服务状态:"

# PM2 状态
if command -v pm2 &> /dev/null; then
    print_info "PM2 进程状态:"
    pm2 list | head -5
fi

# 检查后端进程
print_info "后端进程:"
ps aux | grep -E "node.*backend|node.*dist/index" | grep -v grep || print_warn "未找到后端进程"

# 完成
echo ""
print_info "=========================================="
print_info "✓ 更新完成！"
print_info "=========================================="
print_info "最新提交: $(git rev-parse --short HEAD)"
print_info "提交信息: $(git log -1 --pretty=format:'%s')"
print_info "更新时间: $(date '+%Y-%m-%d %H:%M:%S')"
print_info ""
print_info "查看日志命令:"
if command -v pm2 &> /dev/null; then
    print_info "  后端: pm2 logs tcm-backend"
else
    print_info "  后端: tail -f $BACKEND_DIR/logs/*.log 或 journalctl -u tcm-backend"
fi
print_info "  Nginx: tail -f /var/log/nginx/error.log"
print_info ""
print_info "访问地址: http://$(hostname -I | awk '{print $1}')"
print_info "=========================================="

