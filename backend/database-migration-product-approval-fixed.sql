-- 包材审核功能数据库变更脚本（修复版）
-- 执行日期：2025-12-23
-- 
-- 注意：如果遇到外键约束错误，请先执行以下查询检查表结构：
-- SHOW CREATE TABLE products;
-- SHOW CREATE TABLE users;

-- 方案1：先创建表，再添加外键（推荐）
-- 步骤1：创建表（不包含外键）
CREATE TABLE IF NOT EXISTS product_change_requests (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL COMMENT '产品ID（新增时为新ID，编辑时为现有ID）',
  change_type VARCHAR(20) NOT NULL COMMENT '变更类型：CREATE=新增, UPDATE=编辑',
  status VARCHAR(20) DEFAULT 'PENDING' COMMENT '审核状态：PENDING=待审核, APPROVED=已通过, REJECTED=已驳回',
  pending_changes JSON NOT NULL COMMENT '待审核的变更内容',
  reviewed_by VARCHAR(36) COMMENT '审核人ID',
  reviewed_at DATETIME COMMENT '审核时间',
  reject_reason TEXT COMMENT '驳回原因',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_change_type (change_type),
  INDEX idx_created_at (created_at),
  INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品变更审核记录表';

-- 步骤2：添加外键约束（如果表已存在且字段类型匹配）
-- 注意：如果products表的id是CHAR(36)而不是VARCHAR(36)，需要先修改字段类型
-- 或者删除外键约束，使用应用层保证数据一致性

-- 添加product_id外键
-- ALTER TABLE product_change_requests 
-- ADD CONSTRAINT fk_product_change_requests_product_id 
-- FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 添加reviewed_by外键
-- ALTER TABLE product_change_requests 
-- ADD CONSTRAINT fk_product_change_requests_reviewed_by 
-- FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 方案2：如果外键约束仍然失败，可以暂时不添加外键，由应用层保证数据一致性
-- 表已经创建成功，外键约束可以在后续需要时再添加

