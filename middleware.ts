// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTelegramWebAppData } from './src/lib/utils/telegram-auth';

// Публичные маршруты, не требующие авторизации
const PUBLIC_ROUTES = ['/auth', '/api/auth/telegram'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Пропускаем публичные маршруты
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Для API маршрутов проверяем токен в заголовках
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('x-user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const isValid = await verifyTelegramWebAppData(token);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};