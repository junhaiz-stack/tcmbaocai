# 数据库连接问题解决方案

## 问题描述
无法连接到阿里云 RDS 数据库：`Can't reach database server at pc-bp186uf9xw9p7om6s.mysql.polardb.rds.aliyuncs.com:3306`

## 解决方案

### 方案一：配置 RDS 白名单（推荐用于生产环境）

#### 步骤 1：获取本地公网 IP
访问以下网站查看您的公网 IP：
- https://www.ipip.net
- https://ip.sb
- 或在命令行运行：`curl ifconfig.me`

#### 步骤 2：配置阿里云 RDS 白名单
1. 登录 [阿里云控制台](https://ecs.console.aliyun.com)
2. 进入 **云数据库 RDS** → **实例列表**
3. 找到您的 RDS 实例，点击实例 ID
4. 进入 **数据安全性** → **白名单设置**
5. 点击 **修改**，添加您的公网 IP 地址
   - 格式：`您的IP/32`（例如：`123.456.789.0/32`）
   - 或者添加 `0.0.0.0/0`（允许所有 IP，仅用于开发环境，生产环境不推荐）

#### 步骤 3：检查外网访问设置
1. 在 RDS 实例详情页，查看 **连接信息**
2. 确认 **外网地址** 是否已开启
3. 如果未开启，点击 **申请外网地址**（可能需要几分钟）

#### 步骤 4：测试连接
```bash
cd backend
node test-connection.js
```

### 方案二：使用本地 MySQL 数据库（推荐用于开发环境）

如果暂时无法配置白名单，可以使用本地数据库：

#### 步骤 1：安装本地 MySQL
- Windows: 下载 [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- 或使用 Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0`

#### 步骤 2：创建数据库
```sql
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 步骤 3：更新 `.env` 文件
```env
DATABASE_URL="mysql://root:您的密码@localhost:3306/tcm_supply_chain"
```

#### 步骤 4：初始化数据库
```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

### 方案三：使用 SSH 隧道（适用于有 ECS 服务器的情况）

如果您有阿里云 ECS 服务器，可以通过 SSH 隧道连接：

#### 步骤 1：配置 SSH 隧道
```bash
ssh -L 3307:pc-bp186uf9xw9p7om6s.mysql.polardb.rds.aliyuncs.com:3306 root@您的ECS服务器IP
```

#### 步骤 2：更新 `.env` 文件
```env
DATABASE_URL="mysql://junhaidebug:密码@localhost:3307/tcm_supply_chain"
```

### 方案四：检查连接字符串格式

确认 `backend/.env` 文件中的 `DATABASE_URL` 格式正确：

```env
# 标准格式
DATABASE_URL="mysql://用户名:密码@主机地址:端口/数据库名"

# 如果密码包含特殊字符，需要进行 URL 编码
# ^ = %5E
# * = %2A
# @ = %40
# + = %2B
# % = %25

# 示例（当前配置）
DATABASE_URL="mysql://junhaidebug:%5EnRI%2AdTWgbSGv%257I4%406nsRP4%2B0COg@pc-bp186uf9xw9p7om6s.mysql.polardb.rds.aliyuncs.com:3306/tcm_supply_chain"
```

## 测试连接

运行测试脚本：
```bash
cd backend
node test-connection.js
```

如果连接成功，您会看到：
```
✅ 数据库连接成功！
✅ 查询测试成功
```

## 常见错误及解决方案

### 错误 1：ETIMEDOUT（连接超时）
**原因**：白名单未配置或网络不通
**解决**：配置 RDS 白名单，添加您的 IP 地址

### 错误 2：Access denied（访问被拒绝）
**原因**：用户名或密码错误
**解决**：检查 `.env` 文件中的用户名和密码

### 错误 3：Unknown database（数据库不存在）
**原因**：数据库名称错误或数据库未创建
**解决**：确认数据库名称，或创建数据库

### 错误 4：SSL connection error（SSL 连接错误）
**原因**：RDS 要求 SSL 连接
**解决**：在连接字符串后添加 `?sslaccept=strict`

## 快速检查清单

- [ ] RDS 白名单已配置（包含您的 IP）
- [ ] RDS 外网地址已开启
- [ ] `.env` 文件中的 `DATABASE_URL` 格式正确
- [ ] 用户名和密码正确
- [ ] 数据库名称正确
- [ ] 网络连接正常（可以 ping 通 RDS 地址）

## 联系支持

如果以上方案都无法解决问题，请：
1. 检查阿里云 RDS 实例状态（确保实例运行中）
2. 查看 RDS 监控和日志
3. 联系阿里云技术支持



