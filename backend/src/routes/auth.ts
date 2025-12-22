import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 登录（简化版：根据手机号和角色查找用户）
router.post('/login', async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({
        success: false,
        message: '手机号和角色不能为空'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        phone,
        role,
        status: 'ACTIVE'
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

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


