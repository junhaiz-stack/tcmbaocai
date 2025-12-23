-- 修复 products 表中的 packages 字段问题
-- 错误信息：The column `tcm_supply_chain.products.packages` does not exist in the current database
-- 
-- 可能的原因：
-- 1. 数据库中存在旧的 `packages` 字段，但Prisma schema中没有定义
-- 2. Prisma Client缓存问题
--
-- 解决方案：
-- 1. 检查并删除不存在的字段（如果存在）
-- 2. 重新生成Prisma Client

-- ============================================
-- 步骤1：检查表结构
-- ============================================
DESCRIBE products;

-- ============================================
-- 步骤2：如果存在 `packages` 字段，删除它
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
-- 步骤4：重新生成Prisma Client（在应用层执行）
-- ============================================
-- cd backend
-- npx prisma generate

