# 手动启动指南

## 前置条件

1. **安装 MySQL 数据库**
   - 下载：https://dev.mysql.com/downloads/mysql/
   - 或使用包管理器：`choco install mysql`
   - 或使用 XAMPP/WAMP（包含 MySQL）

2. **确保 Node.js 已安装**
   - 检查：`node --version`
   - 如果没有，下载：https://nodejs.org/

## 步骤 1：配置数据库

### 1.1 启动 MySQL 服务

确保 MySQL 服务正在运行。

### 1.2 创建数据库和用户

打开 MySQL 命令行工具（mysql）或使用 MySQL Workbench，执行：

```sql
-- 创建数据库
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER 'tcm_user'@'localhost' IDENTIFIED BY 'tcm_password';

-- 授予权限
GRANT ALL PRIVILEGES ON tcm_supply_chain.* TO 'tcm_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

## 步骤 2：配置后端环境变量

在 `backend` 目录下创建 `.env` 文件：

```env
# 数据库配置（根据你的实际配置修改）
DATABASE_URL="mysql://tcm_user:tcm_password@localhost:3306/tcm_supply_chain"

# 服务器配置
PORT=3001
NODE_ENV=development

# JWT密钥
JWT_SECRET=tcm-secret-key-change-in-production

# CORS配置
CORS_ORIGIN=http://localhost:5173
```

**注意**：如果你的 MySQL 使用不同的用户名、密码或端口，请相应修改 `DATABASE_URL`。MySQL 默认端口是 3306。

## 步骤 3：初始化数据库

在 `backend` 目录下执行：

```bash
# 生成 Prisma Client（已完成）
npm run db:generate

# 运行数据库迁移（创建表结构）
npm run db:migrate

# 填充种子数据（可选，用于测试）
npm run db:seed
```

## 步骤 4：启动后端服务

在 `backend` 目录下执行：

```bash
npm run dev
```

后端服务将在 http://localhost:3001 运行

## 步骤 5：配置前端环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 步骤 6：启动前端服务

在项目根目录执行：

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:5173 运行

## 验证

1. 打开浏览器访问：http://localhost:5173
2. 使用以下测试账号登录：
   - 手机号：`13800138001`，角色：`饮片厂采购`
   - 手机号：`13900139000`，角色：`平台管理方`
   - 手机号：`13600136003`，角色：`包材供应商`

## 常见问题

### 问题 1：数据库连接失败

**错误信息**：`Can't reach database server` 或 `Access denied`

**解决方案**：
- 检查 MySQL 服务是否启动
- 检查 `DATABASE_URL` 中的用户名、密码、端口是否正确（MySQL 默认端口 3306）
- 检查用户权限：确保用户有访问数据库的权限
- 检查防火墙设置

### 问题 2：端口被占用

**错误信息**：`Port 3001 is already in use`

**解决方案**：
- 修改 `backend/.env` 中的 `PORT` 值
- 或关闭占用端口的程序

### 问题 3：Prisma 迁移失败

**错误信息**：`Migration failed`

**解决方案**：
- 检查数据库连接
- 确保数据库用户有足够权限
- 尝试使用 `npm run db:push` 代替 `npm run db:migrate`

## 下一步

- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解生产环境部署
- 查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 了解项目结构

