// 检查数据库中是否有packages字段
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPackagesField() {
  try {
    console.log('正在检查数据库products表结构...\n');
    
    // 检查表结构
    const result = await prisma.$queryRaw`
      DESCRIBE products
    `;
    
    console.log('products 表的字段列表:');
    console.log('='.repeat(70));
    result.forEach((col) => {
      console.log(`  ${String(col.Field).padEnd(25)} ${String(col.Type).padEnd(20)} ${col.Null} ${col.Key || ''}`);
    });
    console.log('='.repeat(70));
    
    // 检查是否有packages字段
    const hasPackages = result.some((col) => String(col.Field) === 'packages');
    
    if (hasPackages) {
      console.log('\n⚠️  发现数据库中存在 `packages` 字段！');
      console.log('   这可能是问题的根源');
      console.log('\n建议：删除该字段');
      console.log('SQL: ALTER TABLE products DROP COLUMN packages;');
    } else {
      console.log('\n✅ 数据库中没有 `packages` 字段');
      console.log('   问题可能是Prisma Client生成时的缓存问题');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackagesField();

