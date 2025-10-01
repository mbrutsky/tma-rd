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
  selectIsAuthenticated,
  selectAuth,
  setAuthLoading
} from '@/src/lib/store/slices/authSlice';
import { tasksApi } from '@/src/lib/store/api/tasksApi';
import { usersApi } from '@/src/lib/store/api/usersApi';
import { businessProcessesApi } from '@/src/lib/store/api/businessProcessesApi';
import { useTelegramDeepLink } from '@/src/hooks/useTelegramDeepLink';
import LoadingScreen from '@/src/components/LoadingScreen';

// Глобальная функция для настройки fetch interceptor
function setupFetchInterceptor() {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  if (!token || !userId) {
    console.log('No token or userId found for interceptor');
    return false;
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
  return true;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, token } = useAppSelector(selectAuth);
  const interceptorSetupRef = useRef(false);
  const authCheckedRef = useRef(false);
  
  // Обработка deep links из Telegram
  useTelegramDeepLink();

  useEffect(() => {
    const initAuth = async () => {
      // Избегаем двойной проверки
      if (authCheckedRef.current) {
        return;
      }
      authCheckedRef.current = true;

      // Пропускаем проверку для страницы авторизации
      if (pathname === '/auth') {
        dispatch(setAuthLoading(false));
        return;
      }

      try {
        // Проверяем, есть ли у нас токен
        const storedToken = localStorage.getItem('authToken');
        
        if (storedToken) {
          console.log('Found stored token, verifying...');
          // Проверяем валидность токена
          await dispatch(verifyToken()).unwrap();
          // Настраиваем interceptor после успешной проверки
          if (setupFetchInterceptor()) {
            // Инвалидируем кеш для перезагрузки данных
            dispatch(tasksApi.util.invalidateTags(['Task']));
            dispatch(usersApi.util.invalidateTags(['User']));
            dispatch(businessProcessesApi.util.invalidateTags(['BusinessProcess']));
          }
        } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          // Если токена нет, но мы в Telegram Web App
          const webApp = window.Telegram.WebApp;
          console.log('No token found, checking Telegram Web App...');
          
          if (webApp.initData) {
            console.log('Telegram initData found, authenticating...');
            // Автоматическая авторизация через Telegram
            const result = await dispatch(authenticateWithTelegram(webApp.initData)).unwrap();
            // Настраиваем interceptor сразу после авторизации
            if (result.token) {
              if (setupFetchInterceptor()) {
                // Инвалидируем кеш API для перезагрузки данных с новой авторизацией
                dispatch(tasksApi.util.invalidateTags(['Task']));
                dispatch(usersApi.util.invalidateTags(['User']));
                dispatch(businessProcessesApi.util.invalidateTags(['BusinessProcess']));
              }
            }
          } else {
            console.log('No Telegram initData, redirecting to auth...');
            // Редирект на страницу авторизации
            router.push('/auth');
          }
        } else if (process.env.NODE_ENV === 'development') {
          // В режиме разработки можем использовать мок-данные
          console.log('Development mode: Auth check bypassed');
          dispatch(setAuthLoading(false));
        } else {
          // В продакшене требуем авторизацию через Telegram
          console.log('Production mode, no auth found, redirecting...');
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Очищаем невалидный токен
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('currentUser');
        router.push('/auth');
      }
    };

    initAuth();
  }, [dispatch, router, pathname]);

  // Настройка interceptor при изменении состояния авторизации
  useEffect(() => {
    if (isAuthenticated && token && !interceptorSetupRef.current) {
      const success = setupFetchInterceptor();
      if (success) {
        interceptorSetupRef.current = true;
        
        // Инвалидируем кеш после настройки interceptor
        dispatch(tasksApi.util.invalidateTags(['Task']));
        dispatch(usersApi.util.invalidateTags(['User']));
        dispatch(businessProcessesApi.util.invalidateTags(['BusinessProcess']));
      }
    }
  }, [isAuthenticated, token, dispatch]);

  // Показываем загрузку во время проверки авторизации
  if (loading && pathname !== '/auth') {
    return <LoadingScreen variant="telegram" message="Проверка авторизации..." />;
  }

  // Проверяем авторизацию для защищенных маршрутов
  if (!isAuthenticated && pathname !== '/auth' && process.env.NODE_ENV !== 'development') {
    // Не показываем контент до редиректа
    return <LoadingScreen variant="telegram" message="Перенаправление..." />;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Настраиваем interceptor сразу при загрузке приложения, если есть токен
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setupFetchInterceptor();
    }
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
      };
    };
  }
}