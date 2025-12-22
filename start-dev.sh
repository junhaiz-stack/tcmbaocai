#!/bin/bash
# Linux/Mac 启动脚本

echo "正在启动开发环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 启动后端
echo ""
echo "启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo "请编辑 backend/.env 文件，配置数据库连接"
fi

echo ""
echo "提示: 请确保 PostgreSQL 数据库已启动"
echo "然后在新终端运行: cd backend && npm run dev"

cd ..

# 启动前端
echo ""
echo "启动前端服务..."
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

echo ""
echo "启动前端开发服务器..."
npm run dev


