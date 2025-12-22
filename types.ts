export enum UserRole {
  MANUFACTURER = 'MANUFACTURER', // TCM Drink Factory (Buyer)
  PLATFORM = 'PLATFORM',         // Regulator/Admin
  SUPPLIER = 'SUPPLIER',         // Packaging Factory (Seller)
  GENERAL_MANAGER = 'GENERAL_MANAGER' // General Manager
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export enum OrderStatus {
  PENDING = 'PENDING',     // Submitted, waiting for platform audit
  APPROVED = 'APPROVED',   // Audited, sent to supplier
  REJECTED = 'REJECTED',   // Rejected by platform
  SHIPPED = 'SHIPPED',     // Supplier shipped
  COMPLETED = 'COMPLETED'  // Manufacturer received
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',       // Normal/Listed
  INACTIVE = 'INACTIVE',   // Deactivated by Supplier (Soft delete)
  DELISTED = 'DELISTED'    // Delisted by Platform (Punishment)
}

export interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  spec: string; // e.g., "500ml", "10x10cm"
  image: string;
  stock: number;
  supplierId: string; // Which supplier makes this
  status: ProductStatus; // New field
  unitPrice?: number; // 单价（最小单位价格）
  unitsPerPackage?: number; // 件装数（整件包含的最小单位数量）
}

export interface LogisticsInfo {
  company: string;
  trackingNumber: string;
  shippedDate: string;
  estimatedArrivalDate: string; 
  batchCode: string; 
}

export interface Order {
  id: string;
  manufacturerName: string; // Who ordered
  productId: string;
  productName: string;
  quantity: number;
  requestDate: string;
  expectedDate: string;
  status: OrderStatus;
  designFileUrl?: string; 
  rejectReason?: string;
  logistics?: LogisticsInfo;
  approvedDate?: string; // 平台审核时间（当状态为 APPROVED 或 REJECTED 时）
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  phone?: string; 
  email?: string;
  address?: string; // 联系地址
  status: UserStatus;
}