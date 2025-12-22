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

// 重新加载环境变量（确保.env文件更新后生效）
dotenv.config({ override: true });

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
const prisma = new PrismaClient();

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default app;


