// app/api/auth/telegram/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { 
  verifyTelegramWebAppData, 
  parseTelegramWebAppData, 
  createUserToken 
} from '@/src/lib/utils/telegram-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    // Проверяем подпись данных от Telegram
    if (!verifyTelegramWebAppData(initData)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    // Парсим данные
    const telegramData = parseTelegramWebAppData(initData);
    if (!telegramData || !telegramData.user) {
      return NextResponse.json(
        { success: false, error: 'No user data found' },
        { status: 400 }
      );
    }

    const telegramUser = telegramData.user;
    const telegramUserId = telegramUser.id;

    // Проверяем, существует ли пользователь в БД
    const userResult = await query(
      'SELECT * FROM users WHERE tg_user_id = $1',
      [telegramUserId]
    );

    if (userResult.rows.length === 0) {
      // Пользователь не найден - доступ запрещен
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied. User not registered in the system.' 
        },
        { status: 403 }
      );
    }

    const user = userResult.rows[0];

    // Проверяем, активен ли пользователь
    if (!user.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account is deactivated' 
        },
        { status: 403 }
      );
    }

    // Обновляем last_login_at
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Создаем JWT токен
    const token = await createUserToken(user.id, telegramUserId);

    // Формируем ответ
    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        telegramUserId: user.tg_user_id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        position: user.position,
        email: user.email,
        companyId: user.company_id,
        isActive: user.is_active
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Проверка валидности токена
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // В реальном приложении здесь будет проверка JWT
    const isValid = await verifyTelegramWebAppData(token);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}