// src/components/Providers.tsx

'use client';

import { Provider } from 'react-redux';
import { store } from '@/src/lib/store';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/lib/store/hooks';
import { 
  verifyToken, 
  authenticateWithTelegram,
  selectAuth,
  setAuthLoading
} from '@/src/lib/store/slices/authSlice';
import LoadingScreen from '@/src/components/LoadingScreen';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAppSelector(selectAuth);

  useEffect(() => {
    const initAuth = async () => {
      // Пропускаем проверку для страницы авторизации
      if (pathname === '/auth') {
        dispatch(setAuthLoading(false));
        return;
      }

      try {
        // Проверяем, есть ли у нас токен
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Проверяем валидность токена
          await dispatch(verifyToken()).unwrap();
        } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          // Если токена нет, но мы в Telegram Web App
          const webApp = window.Telegram.WebApp;
          
          if (webApp.initData) {
            // Автоматическая авторизация через Telegram
            await dispatch(authenticateWithTelegram(webApp.initData)).unwrap();
          } else {
            // Редирект на страницу авторизации
            router.push('/auth');
          }
        } else if (process.env.NODE_ENV === 'development') {
          // В режиме разработки можем использовать мок-данные
          console.log('Development mode: Auth check bypassed');
          dispatch(setAuthLoading(false));
        } else {
          // В продакшене требуем авторизацию через Telegram
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        router.push('/auth');
      }
    };

    initAuth();
  }, [dispatch, router, pathname]);

  // Настройка API клиента с токеном
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      // Добавляем интерцептор для всех fetch запросов
      const originalFetch = window.fetch;
      
      // Сохраняем оригинальный fetch только если еще не перезаписали
      if (!window._originalFetch) {
        window._originalFetch = originalFetch;
      }
      
      window.fetch = function(...args) {
        const [resource, config] = args;
        
        // Проверяем, что это не запрос авторизации
        if (typeof resource === 'string' && !resource.includes('/api/auth')) {
          // Добавляем заголовки авторизации
          const newConfig = {
            ...config,
            headers: {
              ...config?.headers,
              'Authorization': `Bearer ${token}`,
              'x-user-id': userId
            }
          };
          
          return window._originalFetch.call(this, resource, newConfig);
        }
        
        return window._originalFetch.call(this, resource, config);
      };
    }
  }, [isAuthenticated]);

  // Показываем загрузку во время проверки авторизации
  if (loading && pathname !== '/auth') {
    return <LoadingScreen variant="telegram" message="Проверка авторизации..." />;
  }

  // Проверяем авторизацию для защищенных маршрутов
  if (!isAuthenticated && pathname !== '/auth' && process.env.NODE_ENV !== 'development') {
    return null; // Router.push сработает в useEffect
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Provider>
  );
}

// Расширяем типы Window для TypeScript
declare global {
  interface Window {
    _originalFetch: typeof fetch;
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        close: () => void;
        expand: () => void;
      };
    };
  }
}