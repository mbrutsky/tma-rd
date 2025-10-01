// src/components/Providers.tsx

'use client';

import { Provider } from 'react-redux';
import { store } from '@/src/lib/store';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/lib/store/hooks';
import { 
  verifyToken, 
  authenticateWithTelegram,
  selectAuth,
  setAuthLoading
} from '@/src/lib/store/slices/authSlice';
import LoadingScreen from '@/src/components/LoadingScreen';

// Глобальная функция для настройки fetch interceptor
function setupFetchInterceptor() {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  if (!token || !userId) {
    console.log('No token or userId found for interceptor');
    return;
  }

  // Сохраняем оригинальный fetch только один раз
  if (!window._originalFetch) {
    window._originalFetch = window.fetch;
  }
  
  window.fetch = function(...args) {
    let [resource, config = {}] = args;
    
    // Проверяем, что это строка (URL) и не запрос авторизации
    if (typeof resource === 'string' && !resource.includes('/api/auth')) {
      // Добавляем заголовки авторизации
      config = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      };
    }
    
    return window._originalFetch.call(this, resource, config);
  };
  
  console.log('Fetch interceptor configured with token');
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, token } = useAppSelector(selectAuth);
  const interceptorSetupRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      // Пропускаем проверку для страницы авторизации
      if (pathname === '/auth') {
        dispatch(setAuthLoading(false));
        return;
      }

      try {
        // Проверяем, есть ли у нас токен
        const storedToken = localStorage.getItem('authToken');
        
        if (storedToken) {
          // Проверяем валидность токена
          await dispatch(verifyToken()).unwrap();
          // Настраиваем interceptor после успешной проверки
          setupFetchInterceptor();
        } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          // Если токена нет, но мы в Telegram Web App
          const webApp = window.Telegram.WebApp;
          
          if (webApp.initData) {
            // Автоматическая авторизация через Telegram
            const result = await dispatch(authenticateWithTelegram(webApp.initData)).unwrap();
            // Настраиваем interceptor сразу после авторизации
            if (result.token) {
              setupFetchInterceptor();
            }
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

  // Настройка interceptor при изменении состояния авторизации
  useEffect(() => {
    if (isAuthenticated && token && !interceptorSetupRef.current) {
      setupFetchInterceptor();
      interceptorSetupRef.current = true;
      
      // Перезагружаем страницу для применения interceptor ко всем запросам
      // Это нужно только один раз после авторизации
      if (pathname !== '/auth') {
        window.location.reload();
      }
    }
  }, [isAuthenticated, token, pathname]);

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
  // Настраиваем interceptor сразу при загрузке приложения, если есть токен
  useEffect(() => {
    setupFetchInterceptor();
  }, []);
  
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