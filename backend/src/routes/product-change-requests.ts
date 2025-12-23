import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取变更请求列表
router.get('/', async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/product-change-requests.ts:8',message:'GET /product-change-requests called',data:{query:req.query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  try {
    const { status, productId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (productId) {
      where.productId = productId as string;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/product-change-requests.ts:19',message:'Before Prisma query',data:{where},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    // 查询所有符合条件的请求
    // 注意：对于CREATE类型的请求，productId可能是空字符串，Prisma会报错
    // 解决方案：分别查询有productId和没有productId的记录
    const whereWithProduct: any = { ...where, productId: { not: '' } };
    const whereWithoutProduct: any = { ...where, productId: '' };
    
    // 如果where中已经有productId条件，需要调整
    if (where.productId) {
      if (where.productId === '') {
        // 只查询没有productId的记录
        whereWithProduct.productId = undefined;
      } else {
        // 只查询有productId的记录
        whereWithoutProduct.productId = undefined;
      }
    }
    
    const queryPromises: Promise<any>[] = [];
    
    // 查询有productId的记录（包含product关联）
    if (whereWithProduct.productId !== undefined) {
      queryPromises.push(
        prisma.productChangeRequest.findMany({
          where: whereWithProduct,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                supplierId: true,
                status: true
              }
            },
            reviewer: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }
    
    // 查询没有productId的记录（不包含product关联，避免Prisma报错）
    if (whereWithoutProduct.productId !== undefined) {
      queryPromises.push(
        prisma.productChangeRequest.findMany({
          where: whereWithoutProduct,
          include: {
            reviewer: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }
    
    const [requestsWithProduct, requestsWithoutProduct] = await Promise.all(queryPromises);

    // 合并结果，为没有product的记录添加null product
    const requests = [
      ...requestsWithProduct,
      ...requestsWithoutProduct.map((req: any) => ({ ...req, product: null }))
    ].sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/product-change-requests.ts:107',message:'Prisma query result',data:{totalRequests:requests.length,requests:requests.map(r=>({id:r.id,changeType:r.changeType,status:r.status,productId:r.productId,hasProduct:!!r.product,productSupplierId:r.product?.supplierId,pendingChangesSupplierId:(r.pendingChanges as any)?.supplierId}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    res.json({
      success: true,
      data: requests.map(req => ({
        id: req.id,
        productId: req.productId,
        changeType: req.changeType,
        status: req.status,
        pendingChanges: req.pendingChanges,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt?.toISOString(),
        rejectReason: req.rejectReason,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        product: req.product,
        reviewer: req.reviewer
      }))
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/product-change-requests.ts:66',message:'GET /product-change-requests error',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    res.status(500).json({
      success: false,
      message: error.message || '获取变更请求列表失败'
    });
  }
});

// 创建变更请求
router.post('/', async (req, res) => {
  try {
    const { productId, changeType, pendingChanges } = req.body;

    if (!changeType || !pendingChanges) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const request = await prisma.productChangeRequest.create({
      data: {
        productId: productId || '', // 新增时会在审核通过后创建产品
        changeType,
        status: 'PENDING',
        pendingChanges
      }
    });

    res.json({
      success: true,
      message: '已提交审核，请等待平台审核',
      data: {
        id: request.id,
        productId: request.productId,
        changeType: request.changeType,
        status: request.status,
        createdAt: request.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建变更请求失败'
    });
  }
});

// 审核通过
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.body;

    const request = await prisma.productChangeRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '变更请求不存在'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '该请求已被审核'
      });
    }

    const pendingData: any = request.pendingChanges;

    if (request.changeType === 'CREATE') {
      // 创建新产品
      await prisma.product.create({
        data: {
          name: pendingData.name,
          category: pendingData.category,
          material: pendingData.material,
          spec: pendingData.spec,
          image: pendingData.image,
          stock: pendingData.stock || 0,
          supplierId: pendingData.supplierId,
          status: 'ACTIVE',
          unitPrice: pendingData.unitPrice ? parseFloat(pendingData.unitPrice) : null,
          unitsPerPackage: pendingData.unitsPerPackage ? parseInt(pendingData.unitsPerPackage) : null,
          packageCount: pendingData.packageCount ? parseInt(pendingData.packageCount) : null
        }
      });
    } else {
      // 更新现有产品
      const updateData: any = {};
      if (pendingData.name !== undefined) updateData.name = pendingData.name;
      if (pendingData.category !== undefined) updateData.category = pendingData.category;
      if (pendingData.material !== undefined) updateData.material = pendingData.material;
      if (pendingData.spec !== undefined) updateData.spec = pendingData.spec;
      if (pendingData.image !== undefined) updateData.image = pendingData.image;
      if (pendingData.stock !== undefined) updateData.stock = pendingData.stock;
      if (pendingData.unitPrice !== undefined) {
        updateData.unitPrice = pendingData.unitPrice ? parseFloat(pendingData.unitPrice) : null;
      }
      if (pendingData.unitsPerPackage !== undefined) {
        updateData.unitsPerPackage = pendingData.unitsPerPackage ? parseInt(pendingData.unitsPerPackage) : null;
      }
      if (pendingData.packageCount !== undefined) {
        updateData.packageCount = pendingData.packageCount ? parseInt(pendingData.packageCount) : null;
      }

      await prisma.product.update({
        where: { id: request.productId },
        data: updateData
      });
    }

    // 更新审核记录
    await prisma.productChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: '审核通过'
    });
  } catch (error: any) {
    console.error('审核通过失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '审核失败'
    });
  }
});

// 审核驳回
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, rejectReason } = req.body;

    const request = await prisma.productChangeRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '变更请求不存在'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '该请求已被审核'
      });
    }

    if (!rejectReason) {
      return res.status(400).json({
        success: false,
        message: '请填写驳回原因'
      });
    }

    // 更新审核记录
    await prisma.productChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectReason
      }
    });

    res.json({
      success: true,
      message: '已驳回'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '驳回失败'
    });
  }
});

// 撤销审核请求（供应商操作）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId } = req.body; // 从请求体获取供应商ID

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: '缺少供应商ID'
      });
    }

    // 查找请求
    const request = await prisma.productChangeRequest.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            supplierId: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '变更请求不存在'
      });
    }

    // 验证请求状态为 PENDING
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '只能撤销待审核的请求'
      });
    }

    // 验证请求属于当前供应商
    const pendingData: any = request.pendingChanges;
    let belongsToSupplier = false;

    if (request.changeType === 'CREATE') {
      // 新增：通过 pendingChanges.supplierId 验证
      belongsToSupplier = pendingData.supplierId === supplierId;
    } else {
      // 编辑：通过 product.supplierId 验证
      if (request.product) {
        belongsToSupplier = request.product.supplierId === supplierId;
      } else {
        // 如果产品不存在，也通过 pendingChanges.supplierId 验证
        belongsToSupplier = pendingData.supplierId === supplierId;
      }
    }

    if (!belongsToSupplier) {
      return res.status(403).json({
        success: false,
        message: '无权撤销此请求'
      });
    }

    // 删除请求记录
    await prisma.productChangeRequest.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '已撤销'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '撤销失败'
    });
  }
});

export default router;

