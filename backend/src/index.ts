import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 导入路由
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import uploadRoutes from './routes/upload';
import productChangeRequestRoutes from './routes/product-change-requests';

// 重新加载环境变量（确保.env文件更新后生效）
// #region agent log
try{const fs=require('fs');fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:15',message:'Before dotenv.config',data:{cwd:process.cwd(),envFileExists:fs.existsSync('.env')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});}catch(e){}
// #endregion
dotenv.config({ override: true });
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:17',message:'After dotenv.config',data:{port:process.env.PORT||3001,nodeEnv:process.env.NODE_ENV,hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlLength:process.env.DATABASE_URL?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

// 验证OSS配置（启动时检查）
const validateOSSConfig = () => {
  const requiredEnvVars = ['OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_BUCKET_NAME'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  警告: OSS配置缺失: ${missing.join(', ')}`);
    console.warn('   图片上传功能将不可用，请检查 .env 文件配置');
    console.warn('   配置示例：');
    console.warn('   OSS_REGION=oss-cn-hangzhou');
    console.warn('   OSS_ACCESS_KEY_ID=your_access_key_id');
    console.warn('   OSS_ACCESS_KEY_SECRET=your_access_key_secret');
    console.warn('   OSS_BUCKET_NAME=jpgupupup');
  } else {
    console.log('✅ OSS配置检查通过');
  }
};

validateOSSConfig();

const app = express();
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:36',message:'Express app created',data:{corsOrigin:process.env.CORS_ORIGIN||'http://localhost:5173'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
const prisma = new PrismaClient();
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:44',message:'Prisma client created',data:{prismaVersion:prisma?.$extends?.toString?.()||'N/A',hasProductModel:!!prisma.product},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion

// 中间件
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:40',message:'CORS config',data:{corsOrigin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:45',message:'Incoming request',data:{method:req.method,url:req.url,origin:req.headers.origin,userAgent:req.headers['user-agent']?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:47',message:'Health check endpoint hit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/product-change-requests', productChangeRequestRoutes);
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:56',message:'Routes registered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:59',message:'Error middleware triggered',data:{errorMessage:err?.message,errorStatus:err?.status,url:req.url,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

const PORT = Number(process.env.PORT) || 3001;
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:67',message:'Before app.listen',data:{port:PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// 测试数据库连接
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:107',message:'Before prisma.$connect',data:{hasPrisma:!!prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
prisma.$connect().then(() => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:110',message:'Database connection successful',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.log('✅ 数据库连接成功');
}).catch((error) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:114',message:'Database connection failed',data:{errorMessage:error?.message,errorCode:error?.code,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.error('❌ 数据库连接失败:', error.message);
});

// 启动服务器，明确绑定到所有接口并添加错误处理
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:118',message:'Before app.listen',data:{port:PORT,portType:typeof PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`   本地访问: http://localhost:${PORT}`);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:122',message:'Server listening successfully',data:{port:PORT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
});

server.on('error', (error: any) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:121',message:'Server listen error',data:{errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请检查是否有其他进程在使用该端口`);
  } else {
    console.error('❌ 服务器启动失败:', error.message);
  }
  process.exit(1);
});

// 进程错误处理
process.on('uncaughtException', (error) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:143',message:'Uncaught exception',data:{errorMessage:error.message,errorName:error.name,errorStack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/index.ts:153',message:'Unhandled rejection',data:{reason:reason?.toString?.()||String(reason),reasonType:typeof reason,hasMessage:!!(reason as any)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  console.error('Unhandled Rejection:', reason);
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;


