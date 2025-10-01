// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyUserToken } from './src/lib/utils/telegram-auth';

// Публичные маршруты, не требующие авторизации
const PUBLIC_ROUTES = ['/auth', '/api/auth'];
const PUBLIC_ASSETS = ['/_next', '/favicon.ico', '/public'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Пропускаем статические файлы и assets
  if (PUBLIC_ASSETS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Пропускаем публичные маршруты
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Для API маршрутов проверяем токен в заголовках
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('x-user-id');
    
    console.log('Middleware check:', { pathname, hasAuth: !!authHeader, hasUserId: !!userId });
    
    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyUserToken(token);
      
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      // Проверяем, что userId в токене совпадает с переданным
      if (payload.userId !== userId) {
        return NextResponse.json(
          { error: 'User ID mismatch' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Token verification error:', error);
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