// 直接添加 package_count 字段到数据库
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addField() {
  try {
    console.log('正在检查并添加 package_count 字段...\n');
    
    // 检查字段是否存在
    const result = await prisma.$queryRaw`
      DESCRIBE products
    `;
    
    const hasPackageCount = result.some((col: any) => String(col.Field) === 'package_count');
    
    if (hasPackageCount) {
      console.log('✅ 字段 package_count 已存在于数据库中');
      console.log('   数据库已与 Prisma schema 同步\n');
    } else {
      console.log('❌ 字段 package_count 不存在，正在添加...\n');
      
      // 添加字段
      await prisma.$executeRawUnsafe(`
        ALTER TABLE products 
        ADD COLUMN package_count INT NULL 
        AFTER units_per_package
      `);
      
      console.log('✅ 字段 package_count 已成功添加到数据库\n');
    }

    // 验证字段
    const resultAfter = await prisma.$queryRaw`DESCRIBE products`;
    const packageCountField = resultAfter.find((col: any) => String(col.Field) === 'package_count');
    
    if (packageCountField) {
      console.log('字段信息:');
      console.log(`  名称: ${packageCountField.Field}`);
      console.log(`  类型: ${packageCountField.Type}`);
      console.log(`  允许 NULL: ${packageCountField.Null}`);
      console.log(`  默认值: ${packageCountField.Default || 'NULL'}\n`);
    }

    // 测试 Prisma 查询
    console.log('测试 Prisma 查询...');
    const product = await prisma.product.findFirst();
    if (product) {
      console.log(`✅ 查询成功: ${product.name}`);
      console.log(`   packageCount: ${product.packageCount ?? 'null'}`);
    } else {
      console.log('⚠️  数据库中没有产品记录');
    }

    console.log('\n✅ 数据库字段已准备就绪，接口可以正常使用 packageCount 字段');

  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ 字段已存在，无需重复添加');
    } else {
      console.error('❌ 错误:', error.message);
      console.error('\n如果遇到 Prisma Client 相关错误，请运行:');
      console.error('  npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

addField();



