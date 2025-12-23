-- 为 products 表添加 package_count 字段
-- 字段类型：INT，允许 NULL
-- 位置：在 units_per_package 字段之后

ALTER TABLE products 
ADD COLUMN package_count INT NULL 
AFTER units_per_package;

-- 验证字段是否添加成功
DESCRIBE products;
