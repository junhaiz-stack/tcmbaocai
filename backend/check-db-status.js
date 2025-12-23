// 检查数据库连接和 packageCount 字段
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:6',message:'Database check started',data:{databaseUrl:process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    console.log('正在检查数据库连接...\n');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:12',message:'Attempting database connection',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:18',message:'Database connection successful',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 检查表结构
    console.log('正在检查 products 表结构...\n');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:23',message:'Checking table structure',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const result = await prisma.$queryRaw`DESCRIBE products`;
    
    console.log('products 表的字段列表:');
    console.log('='.repeat(70));
    result.forEach((col) => {
      console.log(`  ${String(col.Field).padEnd(25)} ${String(col.Type).padEnd(20)} ${col.Null} ${col.Key || ''}`);
    });
    console.log('='.repeat(70));
    
    // 检查是否有 package_count 字段
    const hasPackageCount = result.some((col) => String(col.Field) === 'package_count');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:37',message:'Field check result',data:{hasPackageCount,fieldCount:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (hasPackageCount) {
      console.log('\n✅ package_count 字段已存在于数据库中');
      const packageCountField = result.find((col) => String(col.Field) === 'package_count');
      console.log(`   字段类型: ${packageCountField.Type}`);
      console.log(`   允许 NULL: ${packageCountField.Null}`);
      console.log(`   默认值: ${packageCountField.Default || 'NULL'}\n`);
    } else {
      console.log('\n❌ package_count 字段不存在于数据库中');
      console.log('   正在添加字段...\n');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:49',message:'Attempting to add field',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE products 
          ADD COLUMN package_count INT NULL 
          AFTER units_per_package
        `);
        console.log('✅ package_count 字段已成功添加到数据库\n');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:59',message:'Field added successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (addError) {
        if (addError.message.includes('Duplicate column name')) {
          console.log('✅ 字段已存在（可能是并发添加）\n');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:64',message:'Field already exists',data:{errorMessage:addError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } else {
          throw addError;
        }
      }
    }

    // 测试 Prisma 查询
    console.log('测试 Prisma 查询 packageCount 字段...\n');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:72',message:'Testing Prisma query',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const product = await prisma.product.findFirst();
    if (product) {
      console.log(`✅ 查询成功: ${product.name}`);
      console.log(`   packageCount: ${product.packageCount ?? 'null'}`);
      console.log(`   unitsPerPackage: ${product.unitsPerPackage ?? 'null'}`);
      console.log(`   unitPrice: ${product.unitPrice ?? 'null'}`);
      console.log(`   stock: ${product.stock}\n`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:81',message:'Prisma query successful',data:{productName:product.name,packageCount:product.packageCount,hasPackageCount:product.packageCount !== null && product.packageCount !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } else {
      console.log('⚠️  数据库中没有产品记录\n');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:85',message:'No products found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }

    console.log('✅ 数据库检查完成');
    console.log('✅ 数据库连接正常');
    console.log(hasPackageCount || '✅ package_count 字段已准备就绪');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:95',message:'Database check failed',data:{errorMessage:error.message,errorCode:error.code,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('   数据库连接失败，请检查：');
      console.error('   1. DATABASE_URL 配置是否正确');
      console.error('   2. 数据库服务器是否可访问');
      console.error('   3. 网络连接是否正常');
    } else if (error.message.includes('package_count') || error.message.includes('packageCount')) {
      console.error('   Prisma Client 可能需要重新生成');
      console.error('   请运行: npx prisma generate');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/check-db-status.js:110',message:'Database disconnected',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }
}

checkDatabase();



