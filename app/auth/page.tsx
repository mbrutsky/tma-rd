// app/auth/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { UserRole } from '@/src/lib/models/types';

declare global {
  interface Window {
    // @ts-ignore
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        close: () => void;
        expand: () => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          button_color: string;
          button_text_color: string;
        };
      };
    };
  }
}

interface AuthState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string;
}

export default function TelegramAuthPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    error: null,
    success: false,
    message: 'Проверяем данные авторизации...'
  });

  const authenticateUser = async (initData: string) => {
    try {
      setAuthState({
        loading: true,
        error: null,
        success: false,
        message: 'Авторизация через Telegram...'
      });

      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      // Сохраняем токен и данные пользователя
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      // Устанавливаем заголовки для будущих запросов
      window.localStorage.setItem('userId', data.user.id);

      setAuthState({
        loading: false,
        error: null,
        success: true,
        message: data.user.isNewUser 
          ? 'Добро пожаловать! Ваш аккаунт успешно создан' 
          : 'С возвращением!'
      });

      // Редирект через 1.5 секунды
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Authentication error:', error);
      setAuthState({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        success: false,
        message: ''
      });
    }
  };

  useEffect(() => {
    // Проверяем, что мы в Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Инициализируем Web App
      webApp.ready();
      webApp.expand();

      // Проверяем наличие initData
      if (webApp.initData) {
        authenticateUser(webApp.initData);
      } else {
        setAuthState({
          loading: false,
          error: 'Приложение должно быть открыто через Telegram',
          success: false,
          message: ''
        });
      }
    } else {
      // Для разработки - используем тестовые данные
      if (process.env.NODE_ENV === 'development') {
        // Имитация данных для разработки
        const mockInitData = 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=test_hash';
        
        setAuthState({
          loading: false,
          error: 'Режим разработки: используйте Telegram для полноценной авторизации',
          success: false,
          message: ''
        });

        // Для разработки можно сразу редиректить на главную
        setTimeout(() => {
          localStorage.setItem('authToken', 'dev_token');
          localStorage.setItem('currentUser', JSON.stringify({
            id: 'dev_user_id',
            name: 'Developer User',
            role: UserRole.ADMIN
          }));
          router.push('/');
        }, 1000);
      } else {
        setAuthState({
          loading: false,
          error: 'Приложение должно быть открыто через Telegram',
          success: false,
          message: ''
        });
      }
    }
  }, []);

  const getThemeColors = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    // @ts-ignore
      const theme = window.Telegram.WebApp.themeParams;
      return {
        bg: theme.bg_color || '#ffffff',
        text: theme.text_color || '#000000',
        hint: theme.hint_color || '#999999',
        button: theme.button_color || '#3390ec',
        buttonText: theme.button_text_color || '#ffffff'
      };
    }
    return {
      bg: '#ffffff',
      text: '#000000',
      hint: '#999999',
      button: '#3390ec',
      buttonText: '#ffffff'
    };
  };

  const colors = getThemeColors();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" 
               style={{ backgroundColor: colors.button }}>
            <svg 
              className="w-12 h-12" 
              fill={colors.buttonText}
              viewBox="0 0 24 24"
            >
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Delegator-controller
          </h1>
          <p className="mt-2 text-sm" style={{ color: colors.hint }}>
            Управление задачами для вашей команды
          </p>
        </div>

        {/* Status Card */}
        <div 
          className="rounded-lg border p-6 text-center"
          style={{ 
            borderColor: colors.hint + '30',
            backgroundColor: colors.bg 
          }}
        >
          {authState.loading && (
            <div className="space-y-4">
              <Loader2 
                className="h-12 w-12 animate-spin mx-auto"
                style={{ color: colors.button }}
              />
              <p style={{ color: colors.text }}>
                {authState.message}
              </p>
            </div>
          )}

          {authState.success && (
            <div className="space-y-4">
              <CheckCircle 
                className="h-12 w-12 mx-auto text-green-500"
              />
              <p style={{ color: colors.text }}>
                {authState.message}
              </p>
              <p className="text-sm" style={{ color: colors.hint }}>
                Перенаправляем вас в приложение...
              </p>
            </div>
          )}

          {authState.error && (
            <div className="space-y-4">
              <AlertCircle 
                className="h-12 w-12 mx-auto text-red-500"
              />
              <p className="font-medium" style={{ color: colors.text }}>
                {authState.error.includes('not registered') 
                  ? 'Доступ запрещен' 
                  : 'Ошибка авторизации'}
              </p>
              <p className="text-sm" style={{ color: colors.hint }}>
                {authState.error.includes('not registered')
                  ? 'Вы не зарегистрированы в системе. Обратитесь к администратору для получения доступа.'
                  : authState.error}
              </p>
              {!authState.error.includes('not registered') && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.button,
                    color: colors.buttonText
                  }}
                >
                  Попробовать снова
                </button>
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        {!authState.error && (
          <div className="text-center">
            <p className="text-xs" style={{ color: colors.hint }}>
              Авторизуясь, вы соглашаетесь с условиями использования
            </p>
          </div>
        )}
      </div>
    </div>
  );
}