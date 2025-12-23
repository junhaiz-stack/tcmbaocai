// 直接检查数据库表结构
require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function checkField() {
  let connection;
  try {
    // 从 DATABASE_URL 解析连接信息
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL 未设置');
      return;
    }

    // 解析 MySQL 连接字符串
    // 格式: mysql://user:password@host:port/database
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      console.error('❌ DATABASE_URL 格式错误');
      return;
    }

    const [, user, password, host, port, database] = match;
    
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password: decodeURIComponent(password),
      database
    });

    console.log('✅ 数据库连接成功');
    console.log(`   数据库: ${database}`);
    console.log(`   表: products\n`);

    // 检查表结构
    const [columns] = await connection.execute('DESCRIBE products');
    
    console.log('表 products 的字段列表:');
    console.log('='.repeat(60));
    columns.forEach((col: any) => {
      console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key}`);
    });
    console.log('='.repeat(60));

    // 检查是否有 package_count 字段
    const hasPackageCount = columns.some((col: any) => col.Field === 'package_count');
    
    if (hasPackageCount) {
      console.log('\n✅ 字段 package_count 已存在于数据库中');
    } else {
      console.log('\n❌ 字段 package_count 不存在于数据库中');
      console.log('   正在添加字段...');
      
      // 添加字段
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN package_count INT NULL 
        AFTER units_per_package
      `);
      
      console.log('✅ 字段 package_count 已成功添加到数据库');
    }

    // 再次检查
    const [columnsAfter] = await connection.execute('DESCRIBE products');
    const hasPackageCountAfter = columnsAfter.some((col: any) => col.Field === 'package_count');
    
    if (hasPackageCountAfter) {
      console.log('\n✅ 验证成功：package_count 字段现在存在于数据库中');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('   字段已存在，无需重复添加');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkField();



