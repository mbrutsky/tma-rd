// lib/cors.ts
import { NextRequest } from 'next/server';

export function isApiTokenRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');
  const expectedToken = process.env.APP_API_TOKEN;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === expectedToken;
  }
  
  if (apiKey) {
    return apiKey === expectedToken;
  }
  
  return false;
}

export function checkSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const userAgent = request.headers.get('user-agent');
  
  const allowedHosts = [
    host,
    'localhost:3000',
    process.env.NEXT_PUBLIC_DOMAIN,
  ].filter(Boolean);
  
  // ИСПРАВЛЕНИЕ: Добавляем проверку внутренних запросов
  const isInternalRequest = (
    // Нет origin и referer (внутренний запрос)
    (!origin && !referer) ||
    // Запрос от того же хоста
    (host && (origin?.includes(host) || referer?.includes(host))) ||
    // Next.js server-side запрос
    userAgent?.includes('Next.js')
  );
  
  if (isInternalRequest) {
    return true;
  }
  
  // В development режиме - разрешаем все запросы с localhost
  if (process.env.NODE_ENV === 'development') {
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
    if (isLocalhost) {
      return true;
    }
  }
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (allowedHosts.includes(originHost)) {
        return true;
      }
    } catch (e) {
      // Invalid URL
      return false;
    }
  }
  
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (allowedHosts.includes(refererHost)) {
        return true;
      }
    } catch (e) {
      // Invalid URL
      return false;
    }
  }
  
  return false;
}

export function validateRequest(request: NextRequest): {
  allowed: boolean;
  authType: 'same-origin' | 'api-token' | 'internal' | 'none';
} {
  // Проверяем API токен
  if (isApiTokenRequest(request)) {
    return {
      allowed: true,
      authType: 'api-token',
    };
  }
  
  // Проверяем same-origin для веб-интерфейса
  if (checkSameOrigin(request)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Определяем тип запроса
    if (!origin && !referer) {
      return {
        allowed: true,
        authType: 'internal',
      };
    } else {
      return {
        allowed: true,
        authType: 'same-origin',
      };
    }
  }
  
  return {
    allowed: false,
    authType: 'none',
  };
}