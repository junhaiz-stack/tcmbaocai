-- 修复 products 表中的 packages 字段问题
-- 错误信息：The column `tcm_supply_chain.products.packages` does not exist in the current database
-- 
-- 问题分析：
-- Prisma生成的客户端代码中包含`packages`字段，但数据库表中没有该字段
-- 这导致Prisma查询时尝试访问不存在的字段，报错
--
-- 解决方案：
-- 1. 检查数据库中是否真的存在`packages`字段
-- 2. 如果存在，删除它；如果不存在，需要修复Prisma Client生成问题

-- ============================================
-- 步骤1：检查表结构，确认是否有packages字段
-- ============================================
DESCRIBE products;

-- 或者查看建表语句
SHOW CREATE TABLE products;

-- ============================================
-- 步骤2：如果存在packages字段，删除它
-- ============================================
-- 注意：执行前请先备份数据库
-- ALTER TABLE products DROP COLUMN packages;

-- ============================================
-- 步骤3：验证字段列表（应该包含以下字段）
-- ============================================
-- id, name, category, material, spec, image, stock, supplier_id, status,
-- created_at, updated_at, unit_price, units_per_package, package_count
--
-- 不应该包含：packages

-- ============================================
-- 步骤4：如果数据库中没有packages字段，问题在Prisma Client生成
-- ============================================
-- 需要：
-- 1. 完全删除 node_modules/.prisma 目录
-- 2. 重新运行 npx prisma generate
-- 3. 重启后端服务

