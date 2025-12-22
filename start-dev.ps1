# Windows PowerShell 启动脚本
Write-Host "正在启动开发环境..." -ForegroundColor Green

# 检查 Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 启动后端
Write-Host "`n启动后端服务..." -ForegroundColor Yellow
Set-Location backend
if (!(Test-Path node_modules)) {
    Write-Host "安装后端依赖..." -ForegroundColor Cyan
    npm install
}

# 检查 .env 文件
if (!(Test-Path .env)) {
    Write-Host "创建 .env 文件..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "请编辑 backend/.env 文件，配置数据库连接" -ForegroundColor Yellow
}

Write-Host "`n提示: 请确保 PostgreSQL 数据库已启动" -ForegroundColor Yellow
Write-Host "然后在新终端运行: cd backend && npm run dev" -ForegroundColor Cyan

Set-Location ..

# 启动前端
Write-Host "`n启动前端服务..." -ForegroundColor Yellow
if (!(Test-Path node_modules)) {
    Write-Host "安装前端依赖..." -ForegroundColor Cyan
    npm install
}

Write-Host "`n启动前端开发服务器..." -ForegroundColor Green
npm run dev


