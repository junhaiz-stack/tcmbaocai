-- 包材审核功能数据库变更脚本（product字段可选化）
-- 执行日期：2025-12-23
-- 说明：将product字段改为可选，以支持CREATE类型的审核请求（productId为空字符串的情况）
-- 
-- 注意：由于之前创建表时没有添加外键约束，本次变更不需要修改数据库结构
-- Prisma schema中的 Product? 只是应用层的可选性，不影响数据库表结构
-- 
-- 数据库层面不需要任何变更，因为：
-- 1. product_id 字段类型没有变化（仍然是 VARCHAR(36) NOT NULL）
-- 2. 之前创建表时就没有外键约束（见 database-migration-product-approval-final.sql）
-- 3. Prisma的 Product? 只是应用层的可选性，允许关联查询返回 null
--
-- 验证当前表结构：
-- DESCRIBE product_change_requests;
-- SHOW CREATE TABLE product_change_requests;
--
-- 如果表结构正常，无需执行任何SQL语句
-- 只需要确保 Prisma Client 已重新生成（npx prisma generate）

-- ============================================
-- 以下SQL仅用于验证，不需要执行
-- ============================================

-- 验证表结构
-- SELECT 
--   COLUMN_NAME,
--   DATA_TYPE,
--   IS_NULLABLE,
--   COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'product_change_requests'
-- ORDER BY ORDINAL_POSITION;

-- 验证索引
-- SHOW INDEX FROM product_change_requests;

-- 验证外键约束（应该没有）
-- SELECT 
--   CONSTRAINT_NAME,
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'product_change_requests'
--   AND REFERENCED_TABLE_NAME IS NOT NULL;

