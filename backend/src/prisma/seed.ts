import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充种子数据...');

  // 创建用户
  const manufacturer = await prisma.user.upsert({
    where: { id: 'u1' },
    update: {},
    create: {
      id: 'u1',
      name: '康美中药饮片有限公司',
      role: 'MANUFACTURER',
      avatar: 'https://picsum.photos/id/1/200/200',
      phone: '13800138001',
      email: 'contact@kangmei.com',
      address: '广东省广州市天河区科技园路123号',
      status: 'ACTIVE'
    }
  });

  const platform = await prisma.user.upsert({
    where: { id: 'u2' },
    update: {},
    create: {
      id: 'u2',
      name: '包材合规审核中心',
      role: 'PLATFORM',
      avatar: 'https://picsum.photos/id/2/200/200',
      phone: '13900139000',
      email: 'admin@platform.gov',
      status: 'ACTIVE'
    }
  });

  const supplier1 = await prisma.user.upsert({
    where: { id: 'u3' },
    update: {},
    create: {
      id: 'u3',
      name: '常青环保包装厂',
      role: 'SUPPLIER',
      avatar: 'https://picsum.photos/id/3/200/200',
      phone: '13600136003',
      email: 'sales@evergreen-pack.com',
      address: '江苏省苏州市工业园区环保路456号',
      status: 'ACTIVE'
    }
  });

  const supplier2 = await prisma.user.upsert({
    where: { id: 'u4' },
    update: {},
    create: {
      id: 'u4',
      name: '华南玻璃制品厂',
      role: 'SUPPLIER',
      avatar: 'https://picsum.photos/id/60/200/200',
      phone: '13700137004',
      email: 'sales@huanan-glass.com',
      address: '广东省深圳市宝安区工业大道789号',
      status: 'ACTIVE'
    }
  });

  const generalManager = await prisma.user.upsert({
    where: { id: 'u5' },
    update: {},
    create: {
      id: 'u5',
      name: '总经理',
      role: 'GENERAL_MANAGER',
      avatar: 'https://picsum.photos/id/100/200/200',
      phone: '13500135000',
      email: 'gm@tcm-platform.com',
      status: 'ACTIVE'
    }
  });

  // 创建产品
  const product1 = await prisma.product.upsert({
    where: { id: 'p1' },
    update: {},
    create: {
      id: 'p1',
      name: '环保纤维自立袋 (100g)',
      category: '软包装',
      material: '牛皮纸/PLA',
      spec: '12cm x 20cm',
      image: 'https://picsum.photos/id/20/400/300',
      stock: 50000,
      unitPrice: 0.5,
      unitsPerPackage: 100,
      supplierId: supplier1.id,
      status: 'ACTIVE'
    }
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'p2' },
    update: {},
    create: {
      id: 'p2',
      name: '避光棕色玻璃瓶 (500ml)',
      category: '瓶罐',
      material: '高硼硅玻璃',
      spec: '500ml',
      image: 'https://picsum.photos/id/30/400/300',
      stock: 1200,
      unitPrice: 2.5,
      unitsPerPackage: 24,
      supplierId: supplier1.id,
      status: 'ACTIVE'
    }
  });

  const product3 = await prisma.product.upsert({
    where: { id: 'p3' },
    update: {},
    create: {
      id: 'p3',
      name: '高阻隔真空密封袋',
      category: '袋类',
      material: 'PE/PA复合',
      spec: '20cm x 30cm',
      image: 'https://picsum.photos/id/40/400/300',
      stock: 25000,
      unitPrice: 0.8,
      unitsPerPackage: 50,
      supplierId: supplier1.id,
      status: 'ACTIVE'
    }
  });

  const product4 = await prisma.product.upsert({
    where: { id: 'p4' },
    update: {},
    create: {
      id: 'p4',
      name: '精品中药礼盒',
      category: '礼盒',
      material: '硬纸板/特种纸',
      spec: '30cm x 20cm x 10cm',
      image: 'https://picsum.photos/id/50/400/300',
      stock: 500,
      supplierId: supplier1.id,
      status: 'INACTIVE'
    }
  });

  const product5 = await prisma.product.upsert({
    where: { id: 'p5' },
    update: {},
    create: {
      id: 'p5',
      name: '透明广口玻璃瓶 (200ml)',
      category: '瓶罐',
      material: '钠钙玻璃',
      spec: '200ml',
      image: 'https://picsum.photos/id/70/400/300',
      stock: 3000,
      unitPrice: 1.8,
      unitsPerPackage: 12,
      supplierId: supplier2.id,
      status: 'ACTIVE'
    }
  });

  // 创建订单
  const order1 = await prisma.order.upsert({
    where: { id: 'ORD-001' },
    update: {},
    create: {
      id: 'ORD-001',
      manufacturerId: manufacturer.id,
      manufacturerName: manufacturer.name,
      productId: product1.id,
      productName: product1.name,
      quantity: 5000,
      requestDate: new Date('2023-10-01'),
      expectedDate: new Date('2023-10-15'),
      status: 'COMPLETED',
      approvedDate: new Date('2023-10-02')
    }
  });

  await prisma.logistics.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id,
      company: '顺丰速运',
      trackingNumber: 'SF123456789',
      shippedDate: new Date('2023-10-05'),
      estimatedArrivalDate: new Date('2023-10-08'),
      batchCode: 'BATCH-20231005-A'
    }
  });

  await prisma.order.upsert({
    where: { id: 'ORD-002' },
    update: {},
    create: {
      id: 'ORD-002',
      manufacturerId: manufacturer.id,
      manufacturerName: manufacturer.name,
      productId: product2.id,
      productName: product2.name,
      quantity: 1000,
      requestDate: new Date('2023-10-20'),
      expectedDate: new Date('2023-11-01'),
      status: 'PENDING'
    }
  });

  await prisma.order.upsert({
    where: { id: 'ORD-003' },
    update: {},
    create: {
      id: 'ORD-003',
      manufacturerId: manufacturer.id,
      manufacturerName: manufacturer.name,
      productId: product3.id,
      productName: product3.name,
      quantity: 10000,
      requestDate: new Date('2023-10-22'),
      expectedDate: new Date('2023-11-05'),
      status: 'APPROVED',
      approvedDate: new Date('2023-10-23')
    }
  });

  await prisma.order.upsert({
    where: { id: 'ORD-004' },
    update: {},
    create: {
      id: 'ORD-004',
      manufacturerId: manufacturer.id,
      manufacturerName: manufacturer.name,
      productId: product1.id,
      productName: product1.name,
      quantity: 200,
      requestDate: new Date('2023-10-25'),
      expectedDate: new Date('2023-10-30'),
      status: 'REJECTED',
      rejectReason: '申请数量低于最小起订量 (MOQ) 500个。',
      approvedDate: new Date('2023-10-26')
    }
  });

  console.log('种子数据填充完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


