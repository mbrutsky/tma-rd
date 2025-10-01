// app/api/telegram-link/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername';
const TELEGRAM_APP_NAME = process.env.TELEGRAM_APP_NAME || 'app';

export async function POST(request: NextRequest) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: "Type and ID are required" },
        { status: 400 }
      );
    }

    // Генерируем разные типы ссылок
    let deepLink = '';
    let webLink = '';
    
    // Заменяем дефисы на подчеркивания для Telegram
    const safeId = id.replace(/-/g, '_');
    
    switch (type) {
      case 'task':
        deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}?startapp=task__${safeId}`;
        webLink = `${process.env.NEXT_PUBLIC_APP_URL}/task/${id}`;
        break;
      
    //   case 'process':
    //     deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}?startapp=process__${safeId}`;
    //     webLink = `${process.env.NEXT_PUBLIC_APP_URL}/process/${id}`;
    //     break;
      
    //   case 'report':
    //     deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}?startapp=report__${safeId}`;
    //     webLink = `${process.env.NEXT_PUBLIC_APP_URL}/report/${id}`;
    //     break;
      
      default:
        return NextResponse.json(
          { success: false, error: "Invalid type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        deepLink,  // Ссылка для открытия в Telegram
        webLink,   // Обычная веб-ссылка
        type,
        id
      }
    });
  } catch (error) {
    console.error('Error generating Telegram link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate link' },
      { status: 500 }
    );
  }
}

// GET метод для получения информации о ссылке
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  
  if (!taskId) {
    return NextResponse.json(
      { success: false, error: "Task ID is required" },
      { status: 400 }
    );
  }

  const safeId = taskId.replace(/-/g, '_');
  const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}?startapp=task__${safeId}`;
  const webLink = `${process.env.NEXT_PUBLIC_APP_URL}/task/${taskId}`;

  return NextResponse.json({
    success: true,
    data: {
      deepLink,
      webLink,
      taskId
    }
  });
}