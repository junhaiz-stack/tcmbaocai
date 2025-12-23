#!/bin/bash

# 阿里云 ECS 代码更新脚本
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

# 项目目录
PROJECT_DIR="/opt/tcmbaocai"

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

# 步骤 4: 检查 Docker 是否运行
print_step "3. 检查 Docker 服务..."
if ! systemctl is-active --quiet docker; then
    print_error "Docker 服务未运行，正在启动..."
    systemctl start docker
    sleep 3
fi

# 步骤 5: 重新构建后端镜像
print_step "4. 重新构建后端镜像..."
print_info "这可能需要 5-10 分钟，请耐心等待..."
if docker build -t tcm-backend ./backend; then
    print_info "✓ 后端镜像构建成功"
else
    print_error "后端镜像构建失败"
    exit 1
fi

# 步骤 6: 重新构建前端镜像
print_step "5. 重新构建前端镜像..."
print_info "这可能需要 5-10 分钟，请耐心等待..."
if docker build -t tcm-frontend .; then
    print_info "✓ 前端镜像构建成功"
else
    print_error "前端镜像构建失败"
    exit 1
fi

# 步骤 7: 重启后端容器
print_step "6. 重启后端容器..."
if docker ps -a | grep -q tcm_backend; then
    print_info "停止旧的后端容器..."
    docker stop tcm_backend 2>/dev/null || true
    docker rm tcm_backend 2>/dev/null || true
fi

print_info "启动新的后端容器..."
if docker run -d --name tcm_backend \
  -p 3001:3001 \
  --env-file ./backend/.env \
  --network tcm_network \
  --restart unless-stopped \
  tcm-backend; then
    print_info "✓ 后端容器启动成功"
else
    print_error "后端容器启动失败"
    exit 1
fi

# 步骤 8: 重启前端容器
print_step "7. 重启前端容器..."
if docker ps -a | grep -q tcm_frontend; then
    print_info "停止旧的前端容器..."
    docker stop tcm_frontend 2>/dev/null || true
    docker rm tcm_frontend 2>/dev/null || true
fi

print_info "启动新的前端容器..."
if docker run -d --name tcm_frontend \
  --network tcm_network \
  --restart unless-stopped \
  tcm-frontend; then
    print_info "✓ 前端容器启动成功"
else
    print_error "前端容器启动失败"
    exit 1
fi

# 步骤 9: 等待服务启动
print_step "8. 等待服务启动..."
sleep 5

# 步骤 10: 健康检查
print_step "9. 执行健康检查..."

# 检查后端
print_info "检查后端服务..."
for i in {1..15}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_info "✓ 后端服务健康"
        break
    fi
    if [ $i -eq 15 ]; then
        print_warn "✗ 后端服务可能未就绪，请检查日志: docker logs tcm_backend"
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

# 步骤 11: 保存更新记录
echo "$CURRENT_COMMIT" > "$PROJECT_DIR/.last_update_commit"

# 步骤 12: 显示容器状态
print_step "10. 当前容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|tcm_"

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
print_info "  后端: docker logs -f tcm_backend"
print_info "  前端: docker logs -f tcm_frontend"
print_info "  Nginx: docker logs -f tcm_nginx"
print_info ""
print_info "访问地址: http://$(hostname -I | awk '{print $1}')"
print_info "=========================================="

