import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 登录（简化版：根据手机号和角色查找用户）
router.post('/login', async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:9',message:'Login request received',data:{phone:req.body.phone,role:req.body.role,hasPhone:!!req.body.phone,hasRole:!!req.body.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:15',message:'Login validation failed',data:{phone,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return res.status(400).json({
        success: false,
        message: '手机号和角色不能为空'
      });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:21',message:'Querying database for user',data:{phone,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const user = await prisma.user.findFirst({
      where: {
        phone,
        role,
        status: 'ACTIVE'
      }
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:31',message:'Database query result',data:{userFound:!!user,userId:user?.id,userName:user?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:35',message:'User not found',data:{phone,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:43',message:'Login successful',data:{userId:user.id,userName:user.name,userRole:user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // 返回用户信息（实际项目中应该返回JWT token）
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          email: user.email,
          status: user.status
        }
      }
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/auth.ts:58',message:'Login error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,200),errorCode:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 重置密码（发送邮件/短信）
router.post('/reset-password', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // TODO: 实际项目中应该发送重置密码链接到邮箱/手机
    // 这里只是模拟
    res.json({
      success: true,
      message: `重置密码链接已发送至手机: ${user.phone} 和 邮箱: ${user.email}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '重置密码失败'
    });
  }
});

export default router;


