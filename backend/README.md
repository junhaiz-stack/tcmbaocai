# 金方包材管理系统 - 后端API

## 技术栈

- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL 数据库

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置数据库

复制 `env.template` 为 `.env`，并配置数据库连接：

**本地 MySQL：**
```env
DATABASE_URL="mysql://user:password@localhost:3306/tcm_supply_chain"
```

**阿里云 RDS MySQL：**
```env
DATABASE_URL="mysql://user:password@rm-xxxxx.mysql.rds.aliyuncs.com:3306/tcm_supply_chain"
```

完整配置示例：
```env
DATABASE_URL="mysql://tcm_user:tcm_password@localhost:3306/tcm_supply_chain"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

**注意**：如果使用阿里云 RDS，请参考 [ALIYUN_RDS_SETUP.md](../ALIYUN_RDS_SETUP.md) 配置白名单和连接。

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 填充种子数据（可选）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 运行

## API 文档

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/reset-password` - 重置密码

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `PATCH /api/users/:id/status` - 切换用户状态

### 产品管理
- `GET /api/products` - 获取包材列表
- `POST /api/products` - 创建包材
- `PUT /api/products/:id` - 更新包材
- `DELETE /api/products/:id` - 删除包材
- `PATCH /api/products/:id/status` - 更新包材状态

### 订单管理
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PATCH /api/orders/:id/status` - 更新订单状态
- `POST /api/orders/:id/ship` - 发货
- `POST /api/orders/:id/confirm` - 确认收货

## 部署

### 构建

```bash
npm run build
```

### 生产环境运行

```bash
npm start
```

### Docker 部署

见项目根目录的 `docker-compose.yml`


