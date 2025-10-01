import { Metadata } from 'next';
import { query } from '@/src/lib/db';

interface TaskLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Получаем информацию о задаче для мета-тегов
    const taskResult = await query(
      `SELECT t.title, t.description, t.status, t.priority, t.due_date, u.name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.creator_id = u.id
       WHERE t.id = $1`,
      [params.id]
    );

    if (taskResult.rows.length === 0) {
      return {
        title: 'Задача не найдена',
        description: 'Запрашиваемая задача не существует',
      };
    }

    const task = taskResult.rows[0];
    const statusText = getStatusText(task.status);
    const priorityText = getPriorityText(task.priority);
    
    return {
      title: `${task.title} | Задачи`,
      description: task.description ? 
        `${task.description.substring(0, 160)}...` : 
        `Задача от ${task.creator_name || 'неизвестного пользователя'}. Статус: ${statusText}, Приоритет: ${priorityText}`,
      
      // Open Graph теги для социальных сетей
      openGraph: {
        title: task.title,
        description: task.description || `Задача в статусе "${statusText}"`,
        type: 'website',
        url: `/task/${params.id}`,
        siteName: 'Система управления задачами',
        images: [
          {
            url: '/task-preview.png', // Создайте стандартное изображение для задач
            width: 1200,
            height: 630,
            alt: 'Предварительный просмотр задачи',
          },
        ],
      },
      
      // Twitter Card теги
      twitter: {
        card: 'summary_large_image',
        title: task.title,
        description: task.description || `Задача в статусе "${statusText}"`,
        images: ['/task-preview.png'],
      },
    };
  } catch (error) {
    console.error('Error generating task metadata:', error);
    return {
      title: 'Задача',
      description: 'Просмотр задачи',
    };
  }
}

// Вспомогательные функции для мета-тегов
function getStatusText(status: string): string {
  switch (status) {
    case 'new': return 'Новая';
    case 'acknowledged': return 'Ознакомлен';
    case 'in_progress': return 'В работе';
    case 'paused': return 'Приостановлена';
    case 'waiting_control': return 'Ждет контроля';
    case 'on_control': return 'На контроле';
    case 'completed': return 'Завершена';
    default: return 'Неизвестно';
  }
}

function getPriorityText(priority: number): string {
  switch (priority) {
    case 1: return 'Критический';
    case 2: return 'Высокий';
    case 3: return 'Средний';
    case 4: return 'Низкий';
    case 5: return 'Очень низкий';
    default: return 'Неизвестно';
  }
}

export default function TaskLayout({ children }: TaskLayoutProps) {
  return children;
}