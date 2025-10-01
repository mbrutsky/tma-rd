import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.S3_HOST || '192.168.2.101',
  port: parseInt(process.env.S3_PORT || '9010'),
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY || '4rfjrTM3nbwP3Yupxlur',
  secretKey: process.env.S3_SECRET_KEY || 'NTzJwz9RW2NqaaaOxiqtgPjpYWRWuc3cpAbxJfL5',
});

export const BUCKET_NAME = process.env.S3_BUCKET || 'tma-users-files';

// Проверяем существование bucket при инициализации
async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created`);
      
      // Устанавливаем политику доступа для чтения файлов
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
}

// Вызываем при импорте модуля
ensureBucketExists();

export { minioClient };