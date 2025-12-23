// 测试 packageCount 字段是否存在于数据库
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPackageCount() {
  try {
    console.log('正在测试 packageCount 字段...');
    
    // 尝试查询一个产品，检查是否有 packageCount 字段
    const product = await prisma.product.findFirst();
    
    if (product) {
      console.log('✅ 找到产品:', product.name);
      console.log('   packageCount:', product.packageCount);
      console.log('   unitsPerPackage:', product.unitsPerPackage);
      console.log('   unitPrice:', product.unitPrice);
      console.log('   stock:', product.stock);
      
      // 尝试更新 packageCount
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { packageCount: (product.packageCount || 0) + 1 }
      });
      console.log('✅ 更新成功，新的 packageCount:', updated.packageCount);
      
      // 恢复原值
      await prisma.product.update({
        where: { id: product.id },
        data: { packageCount: product.packageCount }
      });
      console.log('✅ 已恢复原值');
    } else {
      console.log('⚠️  数据库中没有产品，但字段应该已存在');
    }
    
    // 检查表结构
    const tableInfo = await prisma.$queryRaw`
      DESCRIBE products
    `;
    const hasPackageCount = tableInfo.some((col: any) => col.Field === 'package_count');
    
    if (hasPackageCount) {
      console.log('✅ 数据库表 products 中已存在 package_count 字段');
    } else {
      console.log('❌ 数据库表 products 中不存在 package_count 字段');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.message.includes('package_count') || error.message.includes('packageCount')) {
      console.error('   错误提示：packageCount 字段可能不存在于数据库中');
      console.error('   请运行: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPackageCount();



