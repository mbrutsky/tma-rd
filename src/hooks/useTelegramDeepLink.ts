// src/hooks/useTelegramDeepLink.ts

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useTelegramDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Получаем параметр startapp из initDataUnsafe
      const startParam = webApp.initDataUnsafe?.start_param;
      
      if (startParam) {
        console.log('Start param received:', startParam);
        
        // Парсим параметр (например: "task__1a45894f-4b8b-4bcf-a513-07866013748a")
        if (startParam.startsWith('task__')) {
          const taskId = startParam.replace('task__', '');
          // Редирект на страницу задачи
          router.push(`/task/${taskId}`);
        } else if (startParam.startsWith('process__')) {
          const processId = startParam.replace('process__', '');
          router.push(`/process/${processId}`);
        }
        // Добавьте другие типы deep links по необходимости
      }
    }
  }, [router]);
}

// Утилита для генерации ссылок
export function generateTelegramDeepLink(
  botUsername: string,
  appName: string,
  type: 'task' | 'process' | 'user',
  id: string
): string {
  // Заменяем дефисы на подчеркивания, так как Telegram не всегда корректно передает дефисы
  const safeId = id.replace(/-/g, '_');
  const startParam = `${type}__${safeId}`;
  
  return `https://t.me/${botUsername}/${appName}?startapp=${startParam}`;
}

// Утилита для парсинга ID обратно
export function parseTaskIdFromParam(param: string): string {
  // Восстанавливаем дефисы
  return param.replace(/_/g, '-');
}