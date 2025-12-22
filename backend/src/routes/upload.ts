import express from 'express';
import multer from 'multer';
import { uploadToOSS, getSignedUrl, extractObjectName } from '../utils/oss';

const router = express.Router();

// 配置multer（内存存储，不保存到本地）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片格式
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式'));
    }
  },
});

// 图片上传接口
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    // 根据请求参数判断是头像还是产品图片
    // 如果 query.type === 'avatar'，使用 avatars 文件夹；否则使用 products 文件夹
    // 注意：multer 中间件可能会影响 req.query，需要从 URL 中解析
    // 优先使用 req.query.type，如果不存在则从 URL 中解析
    let typeParam = req.query.type as string | undefined;
    if (!typeParam && req.url) {
      const urlMatch = req.url.match(/[?&]type=([^&]+)/);
      if (urlMatch) {
        typeParam = urlMatch[1];
      }
    }
    const folder = typeParam === 'avatar' ? 'avatars' : 'products';
    
    // 上传到OSS
    const imageUrl = await uploadToOSS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error: any) {
    console.error('上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '图片上传失败'
    });
  }
});

// 获取已存在图片的签名URL（用于私有Bucket）
router.post('/image/sign', express.json(), async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '请提供图片URL'
      });
    }

    // 从URL中提取object name
    const objectName = extractObjectName(url);

    // 生成新的签名URL（有效期1年）
    const signedUrl = await getSignedUrl(objectName, 31536000);

    res.json({
      success: true,
      data: {
        url: signedUrl
      }
    });
  } catch (error: any) {
    console.error('生成签名URL失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成签名URL失败'
    });
  }
});

export default router;

