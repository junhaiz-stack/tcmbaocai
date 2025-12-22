import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取包材列表
router.get('/', async (req, res) => {
  try {
    const { supplierId, status } = req.query;

    const where: any = {};
    if (supplierId) {
      where.supplierId = supplierId as string;
    }
    if (status) {
      where.status = status as string;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        material: p.material,
        spec: p.spec,
        image: p.image,
        stock: p.stock,
        supplierId: p.supplierId,
        status: p.status,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : undefined,
        unitsPerPackage: p.unitsPerPackage || undefined
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取包材列表失败'
    });
  }
});

// 创建包材
router.post('/', async (req, res) => {
  try {
    const { name, category, material, spec, image, stock, supplierId, unitPrice, unitsPerPackage } = req.body;

    if (!name || !category || !material || !spec || !image || supplierId === undefined) {
      return res.status(400).json({
        success: false,
        message: '必填字段不能为空'
      });
    }

    // 检查供应商的包材数量限制
    const productCount = await prisma.product.count({
      where: { supplierId }
    });

    if (productCount >= 5) {
      return res.status(400).json({
        success: false,
        message: '已达到最大包材发布限额 (5件)'
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        material,
        spec,
        image,
        stock: stock || 0,
        supplierId,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        unitsPerPackage: unitsPerPackage ? parseInt(unitsPerPackage) : null,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        material: product.material,
        spec: product.spec,
        image: product.image,
        stock: product.stock,
        supplierId: product.supplierId,
        status: product.status,
        unitPrice: product.unitPrice ? Number(product.unitPrice) : undefined,
        unitsPerPackage: product.unitsPerPackage || undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建包材失败'
    });
  }
});

// 更新包材
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, material, spec, image, stock, unitPrice, unitsPerPackage } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        material,
        spec,
        image,
        stock,
        unitPrice: unitPrice !== undefined ? (unitPrice ? parseFloat(unitPrice) : null) : undefined,
        unitsPerPackage: unitsPerPackage !== undefined ? (unitsPerPackage ? parseInt(unitsPerPackage) : null) : undefined
      }
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        material: product.material,
        spec: product.spec,
        image: product.image,
        stock: product.stock,
        supplierId: product.supplierId,
        status: product.status,
        unitPrice: product.unitPrice ? Number(product.unitPrice) : undefined,
        unitsPerPackage: product.unitsPerPackage || undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新包材失败'
    });
  }
});

// 删除包材
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '删除包材失败'
    });
  }
});

// 更新包材状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        material: product.material,
        spec: product.spec,
        image: product.image,
        stock: product.stock,
        supplierId: product.supplierId,
        status: product.status,
        unitPrice: product.unitPrice ? Number(product.unitPrice) : undefined,
        unitsPerPackage: product.unitsPerPackage || undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新包材状态失败'
    });
  }
});

export default router;


