// api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME } from '@/src/lib/minio';
import { v4 as uuidv4 } from 'uuid';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

export async function POST(request: NextRequest) {
  try {
    // Multi-tenant проверка для изоляции файлов
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ error: 'User not assigned to any company' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    const allowedTypes = {
      avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ]
    };

    const typeAllowedTypes = allowedTypes[type as keyof typeof allowedTypes] || allowedTypes.document;
    
    if (!typeAllowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${typeAllowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // ИЗМЕНЕНИЕ: Включаем company_id в путь файла для изоляции
    const fileName = `${type}/${userCompanyInfo.companyId}/${userId || 'anonymous'}/${uuidv4()}_${sanitizedOriginalName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      file.size,
      {
        'Content-Type': file.type,
        'X-Original-Name': file.name,
        'X-Upload-Date': new Date().toISOString(),
        'X-Company-Id': userCompanyInfo.companyId, // Метаданные для дополнительной проверки
      }
    );

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const fileUrl = `${protocol}://${host}/api/files/${encodeURIComponent(fileName)}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        etag: uploadResult.etag
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Остальные методы GET и DELETE остаются без изменений...
export async function GET(request: NextRequest) {
  try {
      // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ error: 'User not assigned to any company' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const prefix = type ? `${type}/${userId}/` : `${userId}/`;
    const objectsList: any[] = [];

    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);
    
    for await (const obj of stream) {
      if (obj.name) {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const fileUrl = `${protocol}://${host}/api/files/${encodeURIComponent(obj.name)}`;
        
        objectsList.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          url: fileUrl,
          etag: obj.etag
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: objectsList
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json({
      error: 'Failed to get files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ error: 'User not assigned to any company' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    await minioClient.removeObject(BUCKET_NAME, fileName);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}