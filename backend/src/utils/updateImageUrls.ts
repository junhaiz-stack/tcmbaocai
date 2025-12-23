

 * 使用方法：tsx src/utils/updateImageUrls.ts
 */

import { PrismaClient } from '@prisma/client';
import { getSignedUrl, extractObjectName } from './oss';

const prisma = new PrismaClient();

async function updateImageUrls() {
  try {
    console.log('开始更新产品图片URL...');

    // 获取所有产品（image 字段是必需的，所以不需要过滤 null）
    const products = await prisma.product.findMany({
      where: {
        image: {
          not: '',
        },
      },
    });

    console.log(`找到 ${products.length} 个产品需要更新`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      try {
        // 检查URL是否已经是签名URL（包含签名参数）
        if (product.image.includes('Expires=') && product.image.includes('Signature=')) {
          console.log(`产品 ${product.id} 的图片URL已经是签名URL，跳过`);
          continue;
        }

        // 提取object name
        const objectName = extractObjectName(product.image);

        // 生成新的签名URL
        const signedUrl = await getSignedUrl(objectName, 31536000);

        // 更新数据库
        await prisma.product.update({
          where: { id: product.id },
          data: { image: signedUrl },
        });

        console.log(`✓ 已更新产品 ${product.id} (${product.name})`);
        successCount++;
      } catch (error: any) {
        console.error(`✗ 更新产品 ${product.id} 失败:`, error.message);
        failCount++;
      }
    }

    console.log('\n更新完成！');
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);
  } catch (error) {
    console.error('批量更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件，执行更新
if (require.main === module) {
  updateImageUrls();
}

export { updateImageUrls };



