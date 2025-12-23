import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取包材列表
router.get('/', async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:8',message:'GET /products route entry',data:{supplierId:req.query.supplierId,status:req.query.status,prismaClientType:typeof prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { supplierId, status } = req.query;

    const where: any = {};
    if (supplierId) {
      where.supplierId = supplierId as string;
    }
    if (status) {
      where.status = status as string;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:20',message:'Before prisma.product.findMany',data:{where,prismaProductModel:prisma.product?Object.keys(prisma.product):'N/A',prismaClientPath:require.resolve('@prisma/client'),prismaEnginePath:require.resolve('@prisma/client/runtime/library')},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    // 使用 select 明确指定字段，避免查询不存在的字段
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        material: true,
        spec: true,
        image: true,
        stock: true,
        supplierId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        unitPrice: true,
        unitsPerPackage: true,
        packageCount: true,
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:33',message:'After prisma.product.findMany success',data:{productCount:products.length,firstProductKeys:products[0]?Object.keys(products[0]):'N/A',hasPackages:products[0]?.hasOwnProperty('packages'),hasPackageCount:products[0]?.hasOwnProperty('packageCount')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

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
        unitsPerPackage: p.unitsPerPackage || undefined,
        packageCount: p.packageCount || undefined
      }))
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:52',message:'GET /products error',data:{errorName:error?.name,errorMessage:error?.message,errorCode:error?.code,errorStack:error?.stack?.substring(0,500),errorMeta:error?.meta},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    res.status(500).json({
      success: false,
      message: error.message || '获取包材列表失败'
    });
  }
});

// 创建包材
router.post('/', async (req, res) => {
  try {
    const { name, category, material, spec, image, stock, supplierId, unitPrice, unitsPerPackage, packageCount } = req.body;

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
        packageCount: packageCount ? parseInt(packageCount) : null,
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
        unitsPerPackage: product.unitsPerPackage || undefined,
        packageCount: product.packageCount || undefined
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:126',message:'PUT request received',data:{id:req.params.id,bodyKeys:Object.keys(req.body),stock:req.body.stock,unitPrice:req.body.unitPrice,unitsPerPackage:req.body.unitsPerPackage,packageCount:req.body.packageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { id } = req.params;
    const { name, category, material, spec, image, stock, unitPrice, unitsPerPackage, packageCount } = req.body;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:133',message:'Preparing update data',data:{id,name,stock,stockType:typeof stock,unitPrice,unitPriceType:typeof unitPrice,unitsPerPackage,unitsPerPackageType:typeof unitsPerPackage,packageCount,packageCountType:typeof packageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const updateData: any = {
      name,
      category,
      material,
      spec,
      image,
      stock,
      unitPrice: unitPrice !== undefined ? (unitPrice ? parseFloat(unitPrice) : null) : undefined,
      unitsPerPackage: unitsPerPackage !== undefined ? (unitsPerPackage ? parseInt(unitsPerPackage) : null) : undefined,
      packageCount: packageCount !== undefined ? (packageCount ? parseInt(packageCount) : null) : undefined
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:145',message:'Update data prepared',data:{updateData,parsedUnitPrice:updateData.unitPrice,parsedUnitsPerPackage:updateData.unitsPerPackage,parsedPackageCount:updateData.packageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:151',message:'Product updated successfully',data:{productId:product.id,stock:product.stock,packageCount:product.packageCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

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
        unitsPerPackage: product.unitsPerPackage || undefined,
        packageCount: product.packageCount || undefined
      }
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/products.ts:180',message:'Update product error',data:{errorMessage:error.message,errorCode:error.code,errorStack:error.stack?.substring(0,300),requestBody:req.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('更新包材错误:', error);
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
        unitsPerPackage: product.unitsPerPackage || undefined,
        packageCount: product.packageCount || undefined
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


