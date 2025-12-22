// @ts-ignore - ali-oss 没有完整的类型定义
import OSS from 'ali-oss';

// 验证OSS配置
const validateOSSConfig = () => {
  const requiredEnvVars = ['OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_BUCKET_NAME'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  OSS配置缺失: ${missing.join(', ')}`);
    console.warn('   图片上传功能将不可用，请检查 .env 文件配置');
    return false;
  }
  return true;
};

// OSS 客户端配置（延迟初始化，避免配置缺失时立即报错）
let client: OSS | null = null;

const getOSSClient = (): OSS => {
  if (!client) {
    if (!validateOSSConfig()) {
      throw new Error('OSS配置不完整，请检查环境变量配置');
    }
    
    try {
      client = new OSS({
        region: process.env.OSS_REGION || 'oss-cn-hangzhou',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
        bucket: process.env.OSS_BUCKET_NAME!,
      });
      console.log('✅ 阿里云OSS客户端初始化成功');
      console.log(`   区域: ${process.env.OSS_REGION || 'oss-cn-hangzhou'}`);
      console.log(`   Bucket: ${process.env.OSS_BUCKET_NAME}`);
    } catch (initError: any) {
      throw initError;
    }
  }
  return client;
};

/**
 * 上传文件到OSS
 * @param file 文件Buffer
 * @param filename 原始文件名
 * @param contentType 文件MIME类型
 * @returns 返回文件的签名URL（私有Bucket使用）
 */
export async function uploadToOSS(
  file: Buffer,
  filename: string,
  contentType: string,
  folder: 'products' | 'avatars' = 'products'
): Promise<string> {
  try {
    const ossClient = getOSSClient();
    
    // 生成唯一文件名，避免冲突
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop() || 'jpg';
    const objectName = `${folder}/${timestamp}-${randomStr}.${ext}`;

    // 上传到OSS
    const result = await ossClient.put(objectName, file, {
      contentType,
    });

    // 对于私有Bucket，生成签名URL（有效期1年）
    // 如果Bucket是公共读，signatureUrl和url相同
    const signatureUrl = ossClient.signatureUrl(objectName, {
      expires: 31536000, // 1年（秒）
    });

    console.log(`✅ 图片上传成功: ${objectName}`);
    return signatureUrl;
  } catch (error: any) {
    console.error('❌ OSS上传失败:', error);
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      throw new Error('OSS配置错误，请检查AccessKeyId和AccessKeySecret');
    } else if (error.code === 'NoSuchBucket') {
      const bucketName = process.env.OSS_BUCKET_NAME || '未配置';
      const region = process.env.OSS_REGION || 'oss-cn-hangzhou';
      throw new Error(`OSS Bucket不存在。当前配置：Bucket="${bucketName}", Region="${region}"。请检查：1) Bucket名称是否正确 2) Bucket是否在指定区域创建 3) AccessKey是否有访问权限`);
    } else if (error.message && error.message.includes('OSS配置不完整')) {
      throw error;
    }
    throw new Error(error.message || '图片上传失败，请稍后重试');
  }
}

/**
 * 获取OSS文件的签名URL
 * @param objectName OSS对象名称（不包含Bucket域名）
 * @param expires 过期时间（秒），默认1年
 * @returns 返回签名URL
 */
export async function getSignedUrl(
  objectName: string,
  expires: number = 31536000
): Promise<string> {
  try {
    const ossClient = getOSSClient();
    return ossClient.signatureUrl(objectName, { expires });
  } catch (error: any) {
    console.error('生成签名URL失败:', error);
    throw new Error(error.message || '获取图片URL失败');
  }
}

/**
 * 从完整URL中提取object name
 * @param url OSS文件的完整URL
 * @returns object name
 */
export function extractObjectName(url: string): string {
  try {
    const urlObj = new URL(url);
    // 去掉开头的 '/' 和可能的查询参数
    return urlObj.pathname.substring(1).split('?')[0];
  } catch (error) {
    // 如果不是完整URL，可能是object name本身
    return url;
  }
}

/**
 * 删除OSS文件
 * @param url 文件的完整URL或object name
 */
export async function deleteFromOSS(url: string): Promise<void> {
  try {
    const ossClient = getOSSClient();
    // 从URL中提取object name
    const objectName = extractObjectName(url);
    
    await ossClient.delete(objectName);
    console.log(`✅ OSS文件删除成功: ${objectName}`);
  } catch (error) {
    console.error('OSS删除失败:', error);
    // 删除失败不抛出错误，避免影响主流程
  }
}

export default getOSSClient;

