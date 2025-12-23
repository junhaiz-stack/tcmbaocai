-- 包材审核功能数据库变更脚本（最终版 - 无外键约束）
-- 执行日期：2025-12-23
-- 说明：由于外键约束可能导致类型不匹配问题，本版本不添加外键约束
-- Prisma ORM会在应用层处理关联关系，外键约束不是必需的

-- 创建产品变更审核表
CREATE TABLE IF NOT EXISTS product_change_requests (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
  product_id VARCHAR(36) NOT NULL COMMENT '产品ID（新增时为新ID，编辑时为现有ID）',
  change_type VARCHAR(20) NOT NULL COMMENT '变更类型：CREATE=新增, UPDATE=编辑',
  status VARCHAR(20) DEFAULT 'PENDING' COMMENT '审核状态：PENDING=待审核, APPROVED=已通过, REJECTED=已驳回',
  pending_changes JSON NOT NULL COMMENT '待审核的变更内容（JSON格式）',
  reviewed_by VARCHAR(36) NULL COMMENT '审核人ID',
  reviewed_at DATETIME NULL COMMENT '审核时间',
  reject_reason TEXT NULL COMMENT '驳回原因',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引优化查询性能
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_change_type (change_type),
  INDEX idx_created_at (created_at),
  INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品变更审核记录表';

-- 验证表是否创建成功
-- SELECT COUNT(*) FROM product_change_requests;
-- DESCRIBE product_change_requests;

