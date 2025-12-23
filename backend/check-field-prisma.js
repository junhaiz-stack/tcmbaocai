// 使用 Prisma 检查数据库字段
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkField() {
  try {
    console.log('正在检查数据库表结构...\n');
    
    // 使用原始 SQL 查询表结构
    const result = await prisma.$queryRaw`
      DESCRIBE products
    `;
    
    console.log('products 表的字段列表:');
    console.log('='.repeat(70));
    result.forEach((col: any) => {
      console.log(`  ${String(col.Field).padEnd(25)} ${String(col.Type).padEnd(20)} ${col.Null} ${col.Key || ''}`);
    });
    console.log('='.repeat(70));

    // 检查是否有 package_count 字段
    const hasPackageCount = result.some((col: any) => String(col.Field) === 'package_count');
    
    if (hasPackageCount) {
      console.log('\n✅ 字段 package_count 已存在于数据库中');
    } else {
      console.log('\n❌ 字段 package_count 不存在于数据库中');
      console.log('   正在添加字段...');
      
      // 使用原始 SQL 添加字段
      await prisma.$executeRaw`
        ALTER TABLE products 
        ADD COLUMN package_count INT NULL 
        AFTER units_per_package
      `;
      
      console.log('✅ 字段 package_count 已成功添加到数据库');
      
      // 再次检查
      const resultAfter = await prisma.$queryRaw`DESCRIBE products`;
      const hasPackageCountAfter = resultAfter.some((col: any) => String(col.Field) === 'package_count');
      
      if (hasPackageCountAfter) {
        console.log('✅ 验证成功：package_count 字段现在存在于数据库中');
      }
    }

    // 测试查询一个产品
    const product = await prisma.product.findFirst();
    if (product) {
      console.log('\n测试查询产品:');
      console.log(`  产品名称: ${product.name}`);
      console.log(`  packageCount: ${product.packageCount ?? 'null'}`);
      console.log(`  unitsPerPackage: ${product.unitsPerPackage ?? 'null'}`);
      console.log(`  unitPrice: ${product.unitPrice ?? 'null'}`);
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('   字段已存在，无需重复添加');
    } else if (error.message.includes('package_count') || error.message.includes('packageCount')) {
      console.log('   可能是 Prisma Client 需要重新生成');
      console.log('   请运行: npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkField();



