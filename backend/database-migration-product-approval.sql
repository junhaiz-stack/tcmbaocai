-- 包材审核功能数据库变更脚本
-- 执行日期：2025-12-23

-- 1. 修改 products 表的 status 字段，添加 PENDING_APPROVAL 状态
-- 注意：由于已有数据，我们不修改 DEFAULT 值，只确保字段支持新状态

-- 2. 创建产品变更审核表
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
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品变更审核记录表';

-- 3. 添加索引优化查询性能
-- 确保 products 表的 status 字段有索引（通常已存在）
-- CREATE INDEX IF NOT EXISTS idx_status ON products(status);

-- 执行完毕后的验证查询
-- SELECT COUNT(*) FROM product_change_requests;
-- SHOW CREATE TABLE product_change_requests;

