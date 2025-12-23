// 检查数据库结构并修复packages字段问题
require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function checkAndFixDatabase() {
  let connection;
  try {
    // 从 DATABASE_URL 解析连接信息
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL 未设置');
      return;
    }

    // 解析 MySQL 连接字符串
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

    // 检查表结构
    const [columns] = await connection.execute('DESCRIBE products');

    console.log('\nproducts 表的字段列表:');
    console.log('='.repeat(60));
    columns.forEach((col) => {
      console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key}`);
    });
    console.log('='.repeat(60));

    // 检查是否有packages字段
    const hasPackages = columns.some((col) => col.Field === 'packages');

    if (hasPackages) {
      console.log('\n⚠️  发现数据库中存在 `packages` 字段！');
      console.log('   这可能是问题的根源');

      // 删除packages字段
      console.log('\n正在删除 `packages` 字段...');
      await connection.execute('ALTER TABLE products DROP COLUMN packages');
      console.log('✅ 字段 `packages` 已成功删除');

      // 再次检查
      const [columnsAfter] = await connection.execute('DESCRIBE products');
      const hasPackagesAfter = columnsAfter.some((col) => col.Field === 'packages');

      if (!hasPackagesAfter) {
        console.log('✅ 验证成功：`packages` 字段已不存在');
      }
    } else {
      console.log('\n✅ 数据库中没有 `packages` 字段');
    }

    // 检查是否有package_count字段
    const hasPackageCount = columns.some((col) => col.Field === 'package_count');

    if (hasPackageCount) {
      console.log('✅ 字段 `package_count` 已存在于数据库中');
    } else {
      console.log('❌ 字段 `package_count` 不存在于数据库中');
      console.log('   正在添加字段...');

      // 添加字段
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN package_count INT NULL
        AFTER units_per_package
      `);

      console.log('✅ 字段 `package_count` 已成功添加到数据库');
    }

    console.log('\n✅ 数据库结构检查和修复完成');

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFixDatabase();
