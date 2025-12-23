// 测试数据库连接
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// #region agent log
const LOG_PATH = 'd:\\Users\\zhangjunhai\\Desktop\\tcm-supply-chain-link\\.cursor\\debug.log';
const SERVER_ENDPOINT = 'http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65';
const log = (location, message, data, hypothesisId) => {
  const payload = { location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId };
  fetch(SERVER_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
  try { fs.appendFileSync(LOG_PATH, JSON.stringify(payload) + '\n'); } catch (e) {}
};
// #endregion

const prisma = new PrismaClient();

async function testConnection() {
  // #region agent log
  log('test-connection.js:7', '测试开始', {}, 'A');
  // #endregion
  
  try {
    console.log('正在测试数据库连接...');
    
    // #region agent log
    const envPath = path.join(__dirname, '.env');
    const envExists = fs.existsSync(envPath);
    log('test-connection.js:15', '检查.env文件', { exists: envExists, path: envPath }, 'A');
    // #endregion
    
    // #region agent log
    const dbUrlRaw = process.env.DATABASE_URL;
    const dbUrlMasked = dbUrlRaw?.replace(/:[^:@]+@/, ':****@');
    log('test-connection.js:20', '读取DATABASE_URL', { 
      exists: !!dbUrlRaw, 
      length: dbUrlRaw?.length, 
      masked: dbUrlMasked,
      startsWith: dbUrlRaw?.substring(0, 10),
      hasAt: dbUrlRaw?.includes('@'),
      hasColon: dbUrlRaw?.includes(':')
    }, 'A');
    // #endregion
    
    console.log('连接地址:', dbUrlMasked);
    
    // #region agent log
    const urlMatch = dbUrlRaw?.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    log('test-connection.js:32', '解析DATABASE_URL', {
      hasMatch: !!urlMatch,
      host: urlMatch?.[3],
      port: urlMatch?.[4],
      database: urlMatch?.[5],
      userLength: urlMatch?.[1]?.length
    }, 'B');
    // #endregion
    
    // #region agent log
    log('test-connection.js:42', 'Prisma Client初始化前', { 
      prismaExists: !!prisma,
      hasConnect: typeof prisma.$connect === 'function'
    }, 'E');
    // #endregion
    
    // 尝试简单查询
    // #region agent log
    const connectStartTime = Date.now();
    log('test-connection.js:50', '开始连接数据库', { timestamp: connectStartTime }, 'C');
    // #endregion
    
    await prisma.$connect();
    
    // #region agent log
    const connectDuration = Date.now() - connectStartTime;
    log('test-connection.js:57', '连接成功', { duration: connectDuration }, 'C');
    // #endregion
    
    console.log('✅ 数据库连接成功！');
    
    // #region agent log
    const queryStartTime = Date.now();
    log('test-connection.js:64', '开始执行测试查询', { timestamp: queryStartTime }, 'D');
    // #endregion
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // #region agent log
    const queryDuration = Date.now() - queryStartTime;
    log('test-connection.js:71', '查询成功', { duration: queryDuration, resultCount: result?.length }, 'D');
    // #endregion
    
    console.log('✅ 查询测试成功:', result);
    
    // #region agent log
    const dbListStartTime = Date.now();
    log('test-connection.js:78', '开始获取数据库列表', { timestamp: dbListStartTime }, 'D');
    // #endregion
    
    // 检查数据库是否存在
    const databases = await prisma.$queryRaw`SHOW DATABASES`;
    
    // #region agent log
    const dbListDuration = Date.now() - dbListStartTime;
    log('test-connection.js:85', '数据库列表获取成功', { 
      duration: dbListDuration, 
      dbCount: databases?.length,
      hasTargetDb: databases?.some(db => db.Database === 'tcm_supply_chain')
    }, 'D');
    // #endregion
    
    console.log('可用数据库:', databases);
    
    // #region agent log
    log('test-connection.js:94', '测试完成-成功', { totalDuration: Date.now() - connectStartTime }, null);
    // #endregion
    
  } catch (error) {
    // #region agent log
    log('test-connection.js:99', '连接失败-错误捕获', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 200),
      meta: error.meta,
      cause: error.cause?.message
    }, 'F');
    // #endregion
    
    console.error('❌ 连接失败:', error.message);
    console.error('错误代码:', error.code);
    if (error.meta) {
      console.error('详细信息:', error.meta);
    }
    
    // #region agent log
    if (error.message?.includes('Can\'t reach')) {
      log('test-connection.js:113', '网络连接错误', { errorType: 'network_unreachable' }, 'C');
    }
    if (error.message?.includes('Access denied')) {
      log('test-connection.js:116', '认证错误', { errorType: 'authentication_failed' }, 'F');
    }
    if (error.message?.includes('Unknown database')) {
      log('test-connection.js:119', '数据库不存在', { errorType: 'database_not_found' }, 'D');
    }
    // #endregion
  } finally {
    // #region agent log
    log('test-connection.js:125', '开始断开连接', {}, null);
    // #endregion
    
    await prisma.$disconnect();
    
    // #region agent log
    log('test-connection.js:130', '连接已断开', {}, null);
    // #endregion
  }
}

testConnection();

