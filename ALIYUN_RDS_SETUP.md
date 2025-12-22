# 阿里云 RDS MySQL 配置指南

## 一、获取阿里云 RDS 连接信息

### 1. 登录阿里云控制台

访问：https://ecs.console.aliyun.com/

### 2. 进入 RDS 管理页面

1. 在左侧菜单找到 **云数据库 RDS**
2. 选择你的 MySQL 实例

### 3. 获取连接信息

在实例详情页面，你可以找到：
- **连接地址**：例如 `rm-xxxxx.mysql.rds.aliyuncs.com`
- **端口**：通常是 `3306`
- **数据库名**：你创建的数据库名称
- **账号**：数据库用户名
- **密码**：数据库密码

## 二、配置数据库白名单

**重要**：必须将你的 IP 地址添加到 RDS 白名单，否则无法连接。

### 方法 1：添加单个 IP

1. 在 RDS 实例页面，点击 **数据安全性** → **白名单设置**
2. 点击 **添加白名单分组**
3. 输入分组名称（如：开发环境）
4. 添加你的公网 IP 地址
   - 查看本机公网 IP：访问 https://www.ipip.net/ 或 https://ip.sb/
   - 或添加 `0.0.0.0/0`（允许所有 IP，仅用于开发，生产环境不推荐）

### 方法 2：添加 IP 段

如果需要允许多个 IP，可以添加 IP 段，例如：`192.168.0.0/24`

## 三、创建数据库和用户

### 3.1 通过 DMS（数据管理）连接

1. 在 RDS 实例页面，点击 **登录数据库**
2. 使用 DMS 登录后，执行以下 SQL：

```sql
-- 创建数据库（如果还没有）
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果还没有）
CREATE USER 'tcm_user'@'%' IDENTIFIED BY '你的强密码';

-- 授予权限
GRANT ALL PRIVILEGES ON tcm_supply_chain.* TO 'tcm_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

**注意**：
- `'%'` 表示允许从任何 IP 连接（适合开发环境）
- 生产环境建议使用具体 IP：`'tcm_user'@'你的服务器IP'`

### 3.2 通过本地 MySQL 客户端连接

```bash
# 使用 MySQL 命令行客户端
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u root -p

# 然后执行上面的 SQL 语句
```

## 四、配置项目环境变量

### 4.1 更新 backend/.env 文件

编辑 `backend/.env` 文件，修改 `DATABASE_URL`：

```env
# 标准连接（无 SSL）
DATABASE_URL="mysql://tcm_user:你的密码@rm-xxxxx.mysql.rds.aliyuncs.com:3306/tcm_supply_chain"

# 如果 RDS 要求 SSL 连接
DATABASE_URL="mysql://tcm_user:你的密码@rm-xxxxx.mysql.rds.aliyuncs.com:3306/tcm_supply_chain?sslaccept=strict"
```

### 4.2 连接字符串格式说明

```
mysql://[用户名]:[密码]@[主机地址]:[端口]/[数据库名][?参数]
```

**示例**：
```
mysql://tcm_user:MyPassword123@rm-abc123.mysql.rds.aliyuncs.com:3306/tcm_supply_chain
```

## 五、测试连接

### 5.1 使用 Prisma 测试

```bash
cd backend
npm run db:generate
npm run db:push
```

如果连接成功，会看到表结构被创建。

### 5.2 使用 MySQL 客户端测试

```bash
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u tcm_user -p tcm_supply_chain
```

输入密码，如果成功连接，说明配置正确。

## 六、常见问题

### 问题 1：连接超时

**错误信息**：`ETIMEDOUT` 或 `Connection timeout`

**解决方案**：
- 检查白名单是否包含你的 IP
- 检查网络连接（防火墙、VPN 等）
- 确认 RDS 实例状态为"运行中"

### 问题 2：访问被拒绝

**错误信息**：`Access denied for user`

**解决方案**：
- 检查用户名和密码是否正确
- 检查用户是否有访问该数据库的权限
- 确认用户的主机设置（`'%'` 或具体 IP）

### 问题 3：SSL 连接错误

**错误信息**：`SSL connection error`

**解决方案**：
- 在连接字符串中添加 SSL 参数：
  ```
  ?sslaccept=strict
  ```
- 或在 Prisma schema 中配置：
  ```prisma
  datasource db {
    provider = "mysql"
    url      = env("DATABASE_URL")
    relationMode = "prisma"
  }
  ```

### 问题 4：字符编码问题

**解决方案**：
- 确保数据库使用 `utf8mb4` 字符集
- 创建数据库时指定：
  ```sql
  CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

## 七、安全建议

### 生产环境

1. **使用强密码**：至少 16 位，包含大小写字母、数字、特殊字符
2. **限制 IP 访问**：只允许应用服务器的 IP 访问
3. **启用 SSL**：使用 SSL 加密连接
4. **定期备份**：配置 RDS 自动备份
5. **监控告警**：设置 CPU、内存、连接数等监控告警

### 开发环境

1. 可以使用 `0.0.0.0/0` 白名单（仅开发环境）
2. 使用单独的开发数据库账号
3. 定期清理测试数据

## 八、连接池配置（可选）

如果需要优化连接性能，可以在 Prisma schema 中添加连接池参数：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  // 连接池配置
  // connection_limit = 10
  // pool_timeout = 10
}
```

或在连接字符串中添加：

```
mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=10
```

## 九、迁移数据

如果之前使用本地数据库，需要迁移数据：

```bash
# 1. 导出本地数据
mysqldump -u tcm_user -p tcm_supply_chain > backup.sql

# 2. 导入到阿里云 RDS
mysql -h rm-xxxxx.mysql.rds.aliyuncs.com -P 3306 -u tcm_user -p tcm_supply_chain < backup.sql
```

## 十、验证配置

配置完成后，运行：

```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

如果后端服务正常启动，说明连接成功！

