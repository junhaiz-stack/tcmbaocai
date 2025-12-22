# 数据库连接问题排查

## 当前配置

- **连接地址**: `pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com:3306`
- **数据库名**: `tcm_supply_chain`
- **用户名**: `junhaidebug`

## 连接失败原因排查

### 1. 白名单配置检查

**最重要**：确认你的公网 IP 已添加到 PolarDB 白名单

#### 查看你的公网 IP：
- 访问：https://www.ipip.net/
- 或访问：https://ip.sb/

#### 在阿里云控制台检查：
1. 登录阿里云控制台
2. 进入 **云数据库 PolarDB** → 选择你的实例
3. 点击 **数据安全性** → **白名单设置**
4. 确认你的公网 IP 在列表中
5. 如果没有，点击 **修改** 添加你的 IP

**注意**：
- 必须添加**公网 IP**，不是内网 IP（如 10.x.x.x, 192.168.x.x）
- 如果使用 VPN 或代理，需要添加 VPN/代理服务器的 IP
- 可以临时添加 `0.0.0.0/0` 测试（仅开发环境，生产环境不安全）

### 2. 网络连接测试

在 PowerShell 中测试：

```powershell
Test-NetConnection -ComputerName pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com -Port 3306
```

如果 `TcpTestSucceeded` 为 `False`，说明：
- 网络不通
- 白名单未配置
- 防火墙阻止

### 3. 使用 MySQL 客户端测试

如果系统安装了 MySQL 客户端，可以直接测试：

```bash
mysql -h pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com -P 3306 -u junhaidebug -p
```

输入密码：`^nRI*dTWgbSGv%7I4@6nsRP4+0COg`

如果能连接，说明配置正确，问题可能在 Prisma。

### 4. PolarDB 特殊配置

PolarDB 可能需要：
- **SSL 连接**：在连接字符串中添加 `?sslaccept=strict`
- **连接超时设置**：可能需要增加超时时间

尝试修改 `.env` 文件：

```env
# 添加 SSL 参数
DATABASE_URL="mysql://junhaidebug:%5EnRI%2AdTWgbSGv%257I4%406nsRP4%2B0COg@pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com:3306/tcm_supply_chain?sslaccept=strict"

# 或添加连接超时
DATABASE_URL="mysql://junhaidebug:%5EnRI%2AdTWgbSGv%257I4%406nsRP4%2B0COg@pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com:3306/tcm_supply_chain?connect_timeout=60"
```

### 5. 检查数据库是否存在

确认数据库 `tcm_supply_chain` 已创建：

```sql
SHOW DATABASES;
```

如果不存在，创建：

```sql
CREATE DATABASE tcm_supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. 检查用户权限

确认用户 `junhaidebug` 有访问权限：

```sql
SHOW GRANTS FOR 'junhaidebug'@'%';
```

如果没有权限，授予：

```sql
GRANT ALL PRIVILEGES ON tcm_supply_chain.* TO 'junhaidebug'@'%';
FLUSH PRIVILEGES;
```

## 快速测试步骤

1. **检查白名单**（最重要）
   - 查看你的公网 IP
   - 在 PolarDB 控制台添加该 IP

2. **测试网络连接**
   ```powershell
   Test-NetConnection -ComputerName pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com -Port 3306
   ```

3. **使用 MySQL 客户端测试**（如果有）
   ```bash
   mysql -h pc-bp186uf9xw9p7om6s.mysql.polardb.aliyuncs.com -P 3306 -u junhaidebug -p
   ```

4. **尝试添加 SSL 参数**
   修改 `.env` 文件，在连接字符串末尾添加 `?sslaccept=strict`

5. **重新测试**
   ```bash
   npm run db:push
   ```

## 常见错误

### P1001: Can't reach database server
- **原因**：网络不通或白名单未配置
- **解决**：检查白名单，确认公网 IP 已添加

### Access denied
- **原因**：用户名或密码错误，或用户无权限
- **解决**：检查账号密码，确认用户权限

### Unknown database
- **原因**：数据库不存在
- **解决**：创建数据库 `tcm_supply_chain`

