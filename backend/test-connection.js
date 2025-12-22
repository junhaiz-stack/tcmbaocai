// 测试数据库连接
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('正在测试数据库连接...');
    console.log('连接地址:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // 尝试简单查询
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 查询测试成功:', result);
    
    // 检查数据库是否存在
    const databases = await prisma.$queryRaw`SHOW DATABASES`;
    console.log('可用数据库:', databases);
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('错误代码:', error.code);
    if (error.meta) {
      console.error('详细信息:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

