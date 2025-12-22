import { Order, OrderStatus, Product, ProductStatus, User, UserRole, UserStatus } from './types';

// Mock Users
export const USERS: User[] = [
  {
    id: 'u1',
    name: '康美中药饮片有限公司',
    role: UserRole.MANUFACTURER,
    avatar: 'https://picsum.photos/id/1/200/200',
    phone: '13800138001',
    email: 'contact@kangmei.com',
    status: UserStatus.ACTIVE
  },
  {
    id: 'u2',
    name: '包材合规审核中心',
    role: UserRole.PLATFORM,
    avatar: 'https://picsum.photos/id/2/200/200',
    phone: '13900139000',
    email: 'admin@platform.gov',
    status: UserStatus.ACTIVE
  },
  {
    id: 'u3',
    name: '常青环保包装厂',
    role: UserRole.SUPPLIER,
    avatar: 'https://picsum.photos/id/3/200/200',
    phone: '13600136003',
    email: 'sales@evergreen-pack.com',
    status: UserStatus.ACTIVE
  },
  {
    id: 'u4',
    name: '华南玻璃制品厂',
    role: UserRole.SUPPLIER,
    avatar: 'https://picsum.photos/id/60/200/200',
    phone: '13700137004',
    email: 'sales@huanan-glass.com',
    status: UserStatus.ACTIVE
  },
];

// Mock Products
export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '环保纤维自立袋 (100g)',
    category: '软包装',
    material: '牛皮纸/PLA',
    spec: '12cm x 20cm',
    image: 'https://picsum.photos/id/20/400/300',
    stock: 50000,
    supplierId: 'u3',
    status: ProductStatus.ACTIVE,
  },
  {
    id: 'p2',
    name: '避光棕色玻璃瓶 (500ml)',
    category: '瓶罐',
    material: '高硼硅玻璃',
    spec: '500ml',
    image: 'https://picsum.photos/id/30/400/300',
    stock: 1200,
    supplierId: 'u3',
    status: ProductStatus.ACTIVE,
  },
  {
    id: 'p3',
    name: '高阻隔真空密封袋',
    category: '袋类',
    material: 'PE/PA复合',
    spec: '20cm x 30cm',
    image: 'https://picsum.photos/id/40/400/300',
    stock: 25000,
    supplierId: 'u3',
    status: ProductStatus.ACTIVE,
  },
  {
    id: 'p4',
    name: '精品中药礼盒',
    category: '礼盒',
    material: '硬纸板/特种纸',
    spec: '30cm x 20cm x 10cm',
    image: 'https://picsum.photos/id/50/400/300',
    stock: 500,
    supplierId: 'u3',
    status: ProductStatus.INACTIVE,
  },
  {
    id: 'p5',
    name: '透明广口玻璃瓶 (200ml)',
    category: '瓶罐',
    material: '钠钙玻璃',
    spec: '200ml',
    image: 'https://picsum.photos/id/70/400/300',
    stock: 3000,
    supplierId: 'u4',
    status: ProductStatus.ACTIVE,
  }
];

// Initial Mock Orders
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    manufacturerName: '康美中药饮片有限公司',
    productId: 'p1',
    productName: '环保纤维自立袋 (100g)',
    quantity: 5000,
    requestDate: '2023-10-01',
    expectedDate: '2023-10-15',
    status: OrderStatus.COMPLETED,
    logistics: {
      company: '顺丰速运',
      trackingNumber: 'SF123456789',
      shippedDate: '2023-10-05',
      estimatedArrivalDate: '2023-10-08',
      batchCode: 'BATCH-20231005-A',
    },
  },
  {
    id: 'ORD-002',
    manufacturerName: '康美中药饮片有限公司',
    productId: 'p2',
    productName: '避光棕色玻璃瓶 (500ml)',
    quantity: 1000,
    requestDate: '2023-10-20',
    expectedDate: '2023-11-01',
    status: OrderStatus.PENDING,
  },
  {
    id: 'ORD-003',
    manufacturerName: '康美中药饮片有限公司',
    productId: 'p3',
    productName: '高阻隔真空密封袋',
    quantity: 10000,
    requestDate: '2023-10-22',
    expectedDate: '2023-11-05',
    status: OrderStatus.APPROVED,
    approvedDate: '2023-10-23',
  },
  {
    id: 'ORD-004',
    manufacturerName: '康美中药饮片有限公司',
    productId: 'p1',
    productName: '环保纤维自立袋 (100g)',
    quantity: 200,
    requestDate: '2023-10-25',
    expectedDate: '2023-10-30',
    status: OrderStatus.REJECTED,
    rejectReason: '申请数量低于最小起订量 (MOQ) 500个。',
    approvedDate: '2023-10-26',
  },
];