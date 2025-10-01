// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME } from '@/src/lib/minio';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Собираем путь к файлу из параметров
    const filePath = params.path.join('/');
    const decodedFilePath = decodeURIComponent(filePath);

    console.log('Requesting file:', decodedFilePath);

    // Получаем файл из MinIO
    const fileStream = await minioClient.getObject(BUCKET_NAME, decodedFilePath);
    
    // Получаем метаданные файла
    const stats = await minioClient.statObject(BUCKET_NAME, decodedFilePath);
    
    // Читаем поток в буфер
    const chunks: Buffer[] = [];
    
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);

    // Определяем Content-Type из метаданных или по расширению файла
    let contentType = stats.metaData?.['content-type'] || 'application/octet-stream';
    
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = decodedFilePath.split('.').pop()?.toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'csv': 'text/csv'
      };
      contentType = mimeTypes[extension || ''] || 'application/octet-stream';
    }

    // Создаем ответ с правильными заголовками
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Кешируем на год
        'ETag': stats.etag || '',
        'Last-Modified': stats.lastModified?.toUTCString() || '',
        // Добавляем заголовки для безопасности
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline';"
      }
    });

  } catch (error: any) {
    console.error('File serving error:', error);
    
    // Если файл не найден
    if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Другие ошибки
    return NextResponse.json(
      { 
        error: 'Failed to serve file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Дополнительно можно добавить HEAD запрос для получения метаданных
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const decodedFilePath = decodeURIComponent(filePath);

    // Получаем только метаданные файла
    const stats = await minioClient.statObject(BUCKET_NAME, decodedFilePath);
    
    let contentType = stats.metaData?.['content-type'] || 'application/octet-stream';
    
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = decodedFilePath.split('.').pop()?.toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'csv': 'text/csv'
      };
      contentType = mimeTypes[extension || ''] || 'application/octet-stream';
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'ETag': stats.etag || '',
        'Last-Modified': stats.lastModified?.toUTCString() || '',
      }
    });

  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
      return new NextResponse(null, { status: 404 });
    }
    
    return new NextResponse(null, { status: 500 });
  }
}