// components/NotificationButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, CheckCircle, AlertCircle, MessageCircle, Settings, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DatabaseUser, DatabaseNotification, NotificationType } from "../lib/models/types";
import { useGetUserNotificationsQuery, useMarkNotificationAsSentMutation, useDeleteNotificationMutation, useMarkAllUserNotificationsAsReadMutation, useDeleteReadUserNotificationsMutation } from "../lib/store/api/notificationsApi";
import { SheetTrigger, SheetContent, SheetHeader, SheetTitle, Sheet } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface NotificationButtonProps {
  currentUser: DatabaseUser;
}

export default function NotificationButton({ currentUser }: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Получаем уведомления пользователя
  const { data: notifications = [], isLoading, refetch } = useGetUserNotificationsQuery({
    userId: currentUser.id,
    limit: 20
  });

  const [markAsSent] = useMarkNotificationAsSentMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [markAllAsRead] = useMarkAllUserNotificationsAsReadMutation();
  const [deleteReadNotifications] = useDeleteReadUserNotificationsMutation();

  // Подсчитываем непрочитанные уведомления
  useEffect(() => {
    const unread = notifications.filter(n => !n.is_sent).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Обновляем уведомления каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleNotificationClick = async (notification: DatabaseNotification) => {
    // Отмечаем как прочитанное
    if (!notification.is_sent) {
      try {
        await markAsSent({
          id: notification.id,
          telegramSent: true,
          emailSent: true
        });
        refetch();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Если уведомление связано с задачей, можно перейти к ней
    if (notification.task_id) {
      window.location.href = `/task/${notification.task_id}`;
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case NotificationType.TASK_COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case NotificationType.TASK_OVERDUE:
      case NotificationType.DEADLINE_APPROACHING:
        return <Clock className="h-4 w-4 text-red-600" />;
      case NotificationType.COMMENT_ADDED:
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      case NotificationType.SYSTEM:
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationTypeText = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
        return "Назначена задача";
      case NotificationType.TASK_COMPLETED:
        return "Задача выполнена";
      case NotificationType.TASK_OVERDUE:
        return "Задача просрочена";
      case NotificationType.DEADLINE_APPROACHING:
        return "Приближается дедлайн";
      case NotificationType.COMMENT_ADDED:
        return "Новый комментарий";
      case NotificationType.STATUS_CHANGED:
        return "Изменен статус";
      case NotificationType.TASK_REMINDER:
        return "Напоминание";
      case NotificationType.SYSTEM:
        return "Системное уведомление";
      default:
        return "Уведомление";
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(currentUser.id);
      refetch();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем клик по уведомлению
    
    if (confirm('Удалить это уведомление?')) {
      try {
        await deleteNotification(notificationId);
        refetch();
      } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Ошибка при удалении уведомления');
      }
    }
  };

  const handleDeleteAllRead = async () => {
    if (confirm('Удалить все прочитанные уведомления?')) {
      try {
        await deleteReadNotifications(currentUser.id);
        refetch();
      } catch (error) {
        console.error('Error deleting read notifications:', error);
        alert('Ошибка при удалении уведомлений');
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 p-0"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="w-full max-h-[90svh]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between pt-5">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Уведомления
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} новых
                </Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Прочитать все
                </Button>
              )}
              {notifications.some(n => n.is_sent) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAllRead}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Удалить прочитанные
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg mb-2">Нет уведомлений</div>
              <div className="text-sm">
                Здесь будут отображаться ваши уведомления
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border rounded-lg transition-colors relative group ${
                  notification.is_sent 
                    ? 'bg-white hover:bg-gray-50 border-gray-200' 
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Иконка типа уведомления */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Заголовок и время */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          notification.is_sent ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {getNotificationTypeText(notification.notification_type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(notification.created_at, 'HH:mm', { locale: ru })}
                        </span>
                      </div>

                      {/* Текст уведомления */}
                      <div className={`text-sm ${
                        notification.is_sent ? 'text-gray-600' : 'text-blue-800'
                      }`}>
                        {notification.message_text}
                      </div>

                      {/* Информация о задаче, если есть */}
                      {notification.task && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          Задача: {notification.task.title}
                        </div>
                      )}

                      {/* Отправитель, если есть */}
                      {notification.recipient && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={notification.recipient.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {notification.recipient.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">
                            {notification.recipient.name}
                          </span>
                        </div>
                      )}

                      {/* Дата, если не сегодня */}
                      <div className="text-xs text-gray-400 mt-1">
                        {format(notification.created_at, 'd MMM, yyyy', { locale: ru })}
                      </div>
                    </div>

                    {/* Индикатор непрочитанного */}
                    {!notification.is_sent && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>

                {/* Кнопка удаления - показывается при наведении */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600"
                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                  title="Удалить уведомление"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}