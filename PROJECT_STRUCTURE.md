# 项目结构说明

## 目录结构

```
tcm-supply-chain-link/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── services/           # API 服务层
│   ├── types.ts           # TypeScript 类型定义
│   ├── App.tsx            # 主应用组件
│   └── index.tsx          # 入口文件
│
├── backend/                # 后端项目
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── prisma/        # 数据库种子数据
│   │   └── index.ts       # 服务器入口
│   ├── prisma/
│   │   └── schema.prisma  # 数据库 Schema
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml      # Docker 编排配置
├── DEPLOYMENT.md          # 部署指南
└── package.json           # 前端依赖
```

## 技术架构

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **状态管理**: React Hooks (useState, useEffect)
- **API 调用**: Fetch API (封装在 services/api.ts)

### 后端
- **框架**: Express + TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **API 风格**: RESTful

### 数据库
- **类型**: PostgreSQL
- **ORM**: Prisma
- **表结构**:
  - users (用户表)
  - products (包材产品表)
  - orders (订单表)
  - logistics (物流信息表)

## API 端点

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/reset-password` - 重置密码

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `PATCH /api/users/:id/status` - 切换用户状态

### 产品管理
- `GET /api/products` - 获取包材列表（支持筛选）
- `POST /api/products` - 创建包材
- `PUT /api/products/:id` - 更新包材
- `DELETE /api/products/:id` - 删除包材
- `PATCH /api/products/:id/status` - 更新包材状态

### 订单管理
- `GET /api/orders` - 获取订单列表（支持筛选）
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单（含库存校验）
- `PATCH /api/orders/:id/status` - 更新订单状态
- `POST /api/orders/:id/ship` - 发货（自动扣减库存）
- `POST /api/orders/:id/confirm` - 确认收货

## 数据流程

1. **用户登录** → 前端调用 `/api/auth/login` → 后端验证 → 返回用户信息
2. **加载数据** → 前端调用 `/api/orders`, `/api/products`, `/api/users` → 后端查询数据库 → 返回数据
3. **创建订单** → 前端调用 `/api/orders` → 后端校验库存 → 创建订单 → 返回结果
4. **发货** → 前端调用 `/api/orders/:id/ship` → 后端更新订单状态 → 创建物流信息 → 扣减库存 → 返回结果

## 环境变量

### 前端 (.env)
```
VITE_API_BASE_URL=http://localhost:3001/api
```

### 后端 (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/tcm_supply_chain
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 开发流程

1. **启动数据库**: 使用 Docker 或本地 PostgreSQL
2. **启动后端**: `cd backend && npm run dev`
3. **初始化数据库**: `npm run db:migrate && npm run db:seed`
4. **启动前端**: `npm run dev`
5. **访问应用**: http://localhost:5173

## 部署流程

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)


