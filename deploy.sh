#!/bin/bash

# 部署脚本
# 用于在阿里云 ECS 上部署 TCM 供应链管理系统

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 检查必要的命令
print_info "检查必要的命令..."
check_command docker
check_command docker-compose

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    print_warn "backend/.env 文件不存在"
    if [ -f "backend/env.production.template" ]; then
        print_info "从模板创建 .env 文件..."
        cp backend/env.production.template backend/.env
        print_warn "请编辑 backend/.env 文件，填写正确的配置信息"
        exit 1
    else
        print_error "找不到环境变量模板文件"
        exit 1
    fi
fi

# 构建 Docker 镜像
print_info "构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 停止旧容器
print_info "停止旧容器..."
docker-compose -f docker-compose.prod.yml down

# 启动新容器
print_info "启动新容器..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 10

# 健康检查
print_info "检查服务健康状态..."

# 检查后端
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_info "✓ 后端服务健康"
else
    print_warn "✗ 后端服务可能未就绪，请检查日志"
fi

# 检查 Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_info "✓ Nginx 服务健康"
else
    print_warn "✗ Nginx 服务可能未就绪，请检查日志"
fi

# 显示容器状态
print_info "容器状态："
docker-compose -f docker-compose.prod.yml ps

# 显示日志命令提示
print_info "部署完成！"
print_info "查看日志命令："
echo "  docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo ""
print_info "查看所有服务日志："
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
print_info "重启服务："
echo "  docker-compose -f docker-compose.prod.yml restart [service_name]"
echo ""
print_info "停止服务："
echo "  docker-compose -f docker-compose.prod.yml down"

