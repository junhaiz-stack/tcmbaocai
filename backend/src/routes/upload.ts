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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:24',message:'Upload image endpoint called',data:{hasFile:!!req.file,fileName:req.file?.originalname,fileSize:req.file?.size,fileMimetype:req.file?.mimetype,queryType:req.query.type,url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
  // #endregion
  try {
    if (!req.file) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:27',message:'No file in request',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'P'})}).catch(()=>{});
      // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:48',message:'Before uploadToOSS',data:{folder,fileName:req.file.originalname,fileSize:req.file.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
    // #endregion
    
    let imageUrl: string;
    
    try {
      // 尝试上传到OSS
      imageUrl = await uploadToOSS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:58',message:'Upload to OSS successful',data:{imageUrl:imageUrl?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
    } catch (ossError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:61',message:'OSS upload failed, using base64 fallback',data:{errorMessage:ossError?.message,errorCode:ossError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Z'})}).catch(()=>{});
      // #endregion
      
      // OSS上传失败，使用base64作为fallback
      console.warn('⚠️  OSS上传失败，使用base64存储:', ossError.message);
      const base64String = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64String}`;
      imageUrl = dataUrl;
    }

    res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backend/src/routes/upload.ts:66',message:'Upload error',data:{errorName:error?.name,errorMessage:error?.message,errorCode:error?.code,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'S'})}).catch(()=>{});
    // #endregion
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

