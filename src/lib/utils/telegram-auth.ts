// src/lib/utils/telegram-auth.ts

import { createHmac } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export interface TelegramWebAppData {
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  };
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  auth_date: number;
  hash: string;
}

/**
 * Проверяет подпись данных от Telegram Web App
 */
export function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return false;
    }

    // Удаляем hash из параметров для проверки
    urlParams.delete('hash');
    
    // Сортируем параметры
    const params: string[] = [];
    urlParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    params.sort();
    
    // Создаем строку для проверки
    const dataCheckString = params.join('\n');
    
    // Создаем секретный ключ
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    // Вычисляем хеш
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return computedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

/**
 * Парсит данные от Telegram Web App
 */
export function parseTelegramWebAppData(initData: string): TelegramWebAppData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const data: any = {};
    
    urlParams.forEach((value, key) => {
      if (key === 'user' || key === 'chat') {
        data[key] = JSON.parse(value);
      } else if (key === 'auth_date') {
        data[key] = parseInt(value);
      } else {
        data[key] = value;
      }
    });
    
    return data as TelegramWebAppData;
  } catch (error) {
    console.error('Error parsing Telegram data:', error);
    return null;
  }
}

/**
 * Создает JWT токен для пользователя
 */
export async function createUserToken(userId: string, telegramUserId: number): Promise<string> {
  const token = await new SignJWT({ 
    userId, 
    telegramUserId,
    iat: Date.now()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
    
  return token;
}

/**
 * Проверяет JWT токен
 */
export async function verifyUserToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}