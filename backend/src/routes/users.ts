import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取用户列表失败'
    });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { name, role, phone, email, address } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: '姓名和角色不能为空'
      });
    }

    // 验证：厂家和饮片厂必须填写地址
    if ((role === 'MANUFACTURER' || role === 'SUPPLIER') && !address) {
      return res.status(400).json({
        success: false,
        message: '厂家和饮片厂必须填写联系地址'
      });
    }

    // 生成随机头像
    const avatar = `https://picsum.photos/seed/${Date.now()}/200/200`;

    const user = await prisma.user.create({
      data: {
        name,
        role,
        phone,
        email,
        address,
        avatar,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        address: user.address,
        status: user.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建用户失败'
    });
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, address } = req.body;

    // 验证：厂家和饮片厂必须填写地址
    if ((role === 'MANUFACTURER' || role === 'SUPPLIER') && !address) {
      return res.status(400).json({
        success: false,
        message: '厂家和饮片厂必须填写联系地址'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        phone,
        email,
        address
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        address: user.address,
        status: user.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新用户失败'
    });
  }
});

// 更新用户头像（必须在 /:id/status 之前，否则会被误匹配）
router.patch('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: '头像URL不能为空'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatar }
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        status: updatedUser.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新头像失败'
    });
  }
});

// 切换用户状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        status: updatedUser.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新用户状态失败'
    });
  }
});

export default router;


