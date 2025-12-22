import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取订单列表
router.get('/', async (req, res) => {
  try {
    const { status, manufacturerId, manufacturerName } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (manufacturerId) {
      where.manufacturerId = manufacturerId as string;
    }
    if (manufacturerName) {
      where.manufacturerName = manufacturerName as string;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        logistics: true,
        product: {
          select: {
            id: true,
            name: true,
            supplierId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        manufacturerName: order.manufacturerName,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        requestDate: order.requestDate.toISOString().split('T')[0],
        expectedDate: order.expectedDate.toISOString().split('T')[0],
        status: order.status,
        designFileUrl: order.designFileUrl,
        rejectReason: order.rejectReason,
        approvedDate: order.approvedDate ? order.approvedDate.toISOString().split('T')[0] : undefined,
        logistics: order.logistics ? {
          company: order.logistics.company,
          trackingNumber: order.logistics.trackingNumber,
          shippedDate: order.logistics.shippedDate.toISOString().split('T')[0],
          estimatedArrivalDate: order.logistics.estimatedArrivalDate.toISOString().split('T')[0],
          batchCode: order.logistics.batchCode
        } : undefined
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取订单列表失败'
    });
  }
});

// 获取订单详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        logistics: true,
        product: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        manufacturerName: order.manufacturerName,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        requestDate: order.requestDate.toISOString().split('T')[0],
        expectedDate: order.expectedDate.toISOString().split('T')[0],
        status: order.status,
        designFileUrl: order.designFileUrl,
        rejectReason: order.rejectReason,
        approvedDate: order.approvedDate ? order.approvedDate.toISOString().split('T')[0] : undefined,
        logistics: order.logistics ? {
          company: order.logistics.company,
          trackingNumber: order.logistics.trackingNumber,
          shippedDate: order.logistics.shippedDate.toISOString().split('T')[0],
          estimatedArrivalDate: order.logistics.estimatedArrivalDate.toISOString().split('T')[0],
          batchCode: order.logistics.batchCode
        } : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取订单详情失败'
    });
  }
});

// 创建订单
router.post('/', async (req, res) => {
  try {
    const { manufacturerName, manufacturerId, productId, productName, quantity, requestDate, expectedDate } = req.body;

    if (!manufacturerName || !productId || !productName || !quantity || !requestDate || !expectedDate) {
      return res.status(400).json({
        success: false,
        message: '必填字段不能为空'
      });
    }

    // 检查库存
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '包材不存在或已下架'
      });
    }

    if (product.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: '包材不存在或已下架'
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: '库存不足，请联系平台'
      });
    }

    const order = await prisma.order.create({
      data: {
        manufacturerId: manufacturerId || 'unknown',
        manufacturerName,
        productId,
        productName,
        quantity,
        requestDate: new Date(requestDate),
        expectedDate: new Date(expectedDate),
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      data: {
        id: order.id,
        manufacturerName: order.manufacturerName,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        requestDate: order.requestDate.toISOString().split('T')[0],
        expectedDate: order.expectedDate.toISOString().split('T')[0],
        status: order.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建订单失败'
    });
  }
});

// 更新订单状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const updateData: any = {
      status
    };

    // 如果是审核通过或驳回，记录审核时间
    if (status === 'APPROVED' || status === 'REJECTED') {
      updateData.approvedDate = new Date();
    }

    if (status === 'REJECTED' && reason) {
      updateData.rejectReason = reason;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        logistics: true
      }
    });

    res.json({
      success: true,
      data: {
        id: order.id,
        manufacturerName: order.manufacturerName,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        requestDate: order.requestDate.toISOString().split('T')[0],
        expectedDate: order.expectedDate.toISOString().split('T')[0],
        status: order.status,
        rejectReason: order.rejectReason,
        approvedDate: order.approvedDate ? order.approvedDate.toISOString().split('T')[0] : undefined,
        logistics: order.logistics ? {
          company: order.logistics.company,
          trackingNumber: order.logistics.trackingNumber,
          shippedDate: order.logistics.shippedDate.toISOString().split('T')[0],
          estimatedArrivalDate: order.logistics.estimatedArrivalDate.toISOString().split('T')[0],
          batchCode: order.logistics.batchCode
        } : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新订单状态失败'
    });
  }
});

// 发货
router.post('/:id/ship', async (req, res) => {
  try {
    const { id } = req.params;
    const { company, trackingNumber, estimatedArrivalDate, batchCode } = req.body;

    if (!company || !trackingNumber || !estimatedArrivalDate || !batchCode) {
      return res.status(400).json({
        success: false,
        message: '物流信息不完整'
      });
    }

    // 更新订单状态为已发货
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'SHIPPED'
      }
    });

    // 创建或更新物流信息
    await prisma.logistics.upsert({
      where: { orderId: id },
      update: {
        company,
        trackingNumber,
        estimatedArrivalDate: new Date(estimatedArrivalDate),
        batchCode
      },
      create: {
        orderId: id,
        company,
        trackingNumber,
        shippedDate: new Date(),
        estimatedArrivalDate: new Date(estimatedArrivalDate),
        batchCode
      }
    });

    // 扣减库存
    await prisma.product.update({
      where: { id: order.productId },
      data: {
        stock: {
          decrement: order.quantity
        }
      }
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        logistics: true
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedOrder!.id,
        manufacturerName: updatedOrder!.manufacturerName,
        productId: updatedOrder!.productId,
        productName: updatedOrder!.productName,
        quantity: updatedOrder!.quantity,
        requestDate: updatedOrder!.requestDate.toISOString().split('T')[0],
        expectedDate: updatedOrder!.expectedDate.toISOString().split('T')[0],
        status: updatedOrder!.status,
        logistics: updatedOrder!.logistics ? {
          company: updatedOrder!.logistics.company,
          trackingNumber: updatedOrder!.logistics.trackingNumber,
          shippedDate: updatedOrder!.logistics.shippedDate.toISOString().split('T')[0],
          estimatedArrivalDate: updatedOrder!.logistics.estimatedArrivalDate.toISOString().split('T')[0],
          batchCode: updatedOrder!.logistics.batchCode
        } : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '发货失败'
    });
  }
});

// 确认收货
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'COMPLETED'
      },
      include: {
        logistics: true
      }
    });

    res.json({
      success: true,
      data: {
        id: order.id,
        manufacturerName: order.manufacturerName,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        requestDate: order.requestDate.toISOString().split('T')[0],
        expectedDate: order.expectedDate.toISOString().split('T')[0],
        status: order.status,
        logistics: order.logistics ? {
          company: order.logistics.company,
          trackingNumber: order.logistics.trackingNumber,
          shippedDate: order.logistics.shippedDate.toISOString().split('T')[0],
          estimatedArrivalDate: order.logistics.estimatedArrivalDate.toISOString().split('T')[0],
          batchCode: order.logistics.batchCode
        } : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '确认收货失败'
    });
  }
});

export default router;


