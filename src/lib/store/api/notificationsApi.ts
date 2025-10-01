// lib/store/api/notificationsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { DatabaseNotification, CreateNotificationRequest, UpdateNotificationRequest } from '@/src/lib/models/types';
import { currentUserId } from '../../app.config';

function transformDatabaseNotificationToFrontend(dbNotification: any): DatabaseNotification {
  return {
    id: dbNotification.id,
    recipient_user_id: dbNotification.recipient_user_id,
    send_to_telegram: dbNotification.send_to_telegram,
    send_to_email: dbNotification.send_to_email,
    message_text: dbNotification.message_text,
    created_at: new Date(dbNotification.created_at),
    sent_at: dbNotification.sent_at ? new Date(dbNotification.sent_at) : undefined,
    is_sent: dbNotification.is_sent,
    telegram_sent: dbNotification.telegram_sent,
    email_sent: dbNotification.email_sent,
    telegram_sent_at: dbNotification.telegram_sent_at ? new Date(dbNotification.telegram_sent_at) : undefined,
    email_sent_at: dbNotification.email_sent_at ? new Date(dbNotification.email_sent_at) : undefined,
    notification_type: dbNotification.notification_type,
    task_id: dbNotification.task_id,
    company_id: dbNotification.company_id,
    recipient: dbNotification.recipient,
    task: dbNotification.task,
    company: dbNotification.company,
  };
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      headers.set('x-user-id', currentUserId);
      return headers;
    },
  }),
  tagTypes: ['Notification', 'UserNotifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<DatabaseNotification[], {
      userId?: string;
      isSent?: boolean;
      notificationType?: string;
      taskId?: string;
      companyId?: string;
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({
        url: 'notifications',
        params: {
          userId: params.userId,
          isSent: params.isSent?.toString(),
          notificationType: params.notificationType,
          taskId: params.taskId,
          companyId: params.companyId,
          limit: params.limit?.toString() || '50',
          offset: params.offset?.toString() || '0',
        },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformDatabaseNotificationToFrontend);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    
    getNotification: builder.query<DatabaseNotification, string>({
      query: (id) => `notifications/${id}`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      providesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),
    
    // НОВЫЙ: Получение уведомлений конкретного пользователя
    getUserNotifications: builder.query<DatabaseNotification[], {
      userId: string;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }>({
      query: ({ userId, unreadOnly, limit, offset }) => ({
        url: `users/${userId}/notifications`,
        params: {
          unreadOnly: unreadOnly?.toString(),
          limit: limit?.toString() || '20',
          offset: offset?.toString() || '0',
        },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformDatabaseNotificationToFrontend);
      },
      providesTags: (result, error, { userId }) => [
        { type: 'UserNotifications', id: userId },
        ...(result?.map(({ id }) => ({ type: 'Notification' as const, id })) || [])
      ],
    }),
    
    createNotification: builder.mutation<DatabaseNotification, CreateNotificationRequest>({
      query: (notification) => ({
        url: 'notifications',
        method: 'POST',
        body: notification,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    // НОВЫЙ: Создание уведомления для конкретного пользователя
    createUserNotification: builder.mutation<DatabaseNotification, {
      userId: string;
      notification: Omit<CreateNotificationRequest, 'recipient_user_id'>;
    }>({
      query: ({ userId, notification }) => ({
        url: `users/${userId}/notifications`,
        method: 'POST',
        body: notification,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserNotifications', id: userId },
        { type: 'Notification', id: 'LIST' }
      ],
    }),
    
    updateNotification: builder.mutation<DatabaseNotification, { 
      id: string; 
      updates: UpdateNotificationRequest 
    }>({
      query: ({ id, updates }) => ({
        url: `notifications/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        // Инвалидируем пользовательские уведомления
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    markNotificationAsRead: builder.mutation<DatabaseNotification, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'PUT',
        body: { 
          is_sent: true, 
          telegram_sent: true, 
          email_sent: true 
        },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    markNotificationAsSent: builder.mutation<DatabaseNotification, {
      id: string;
      telegramSent?: boolean;
      emailSent?: boolean;
    }>({
      query: ({ id, telegramSent, emailSent }) => ({
        url: `notifications/${id}`,
        method: 'PUT',
        body: { 
          telegram_sent: telegramSent, 
          email_sent: emailSent,
          is_sent: telegramSent || emailSent
        },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification', id },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    // НОВЫЙ: Удаление уведомления
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id: 'LIST' },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    // НОВЫЙ: Массовые операции с уведомлениями пользователя
    markAllUserNotificationsAsRead: builder.mutation<{ updated_count: number }, string>({
      query: (userId) => ({
        url: `users/${userId}/notifications`,
        method: 'PATCH',
        body: { action: 'mark_all_read' },
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserNotifications', id: userId },
        { type: 'Notification', id: 'LIST' }
      ],
    }),
    
    // НОВЫЙ: Удалить все прочитанные уведомления пользователя
    deleteReadUserNotifications: builder.mutation<{ deleted_count: number }, string>({
      query: (userId) => ({
        url: `users/${userId}/notifications`,
        method: 'PATCH',
        body: { action: 'delete_read' },
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserNotifications', id: userId },
        { type: 'Notification', id: 'LIST' }
      ],
    }),
    
    // Остальные существующие endpoints...
    sendBulkNotifications: builder.mutation<{ success: number; failed: number }, {
      recipientIds: string[];
      messageText: string;
      sendToTelegram?: boolean;
      sendToEmail?: boolean;
      notificationType?: string;
      taskId?: string;
    }>({
      query: (data) => ({
        url: 'notifications/bulk-send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
    
    getNotificationStats: builder.query<{
      total: number;
      sent: number;
      pending: number;
      failed: number;
      telegramSent: number;
      emailSent: number;
    }, { companyId?: string; userId?: string }>({
      query: (params) => ({
        url: 'notifications/stats',
        params,
      }),
    }),
    
    sendTestNotification: builder.mutation<DatabaseNotification, {
      recipientId: string;
      messageText: string;
      sendToTelegram?: boolean;
      sendToEmail?: boolean;
    }>({
      query: (data) => ({
        url: 'notifications/test-send',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseNotificationToFrontend(response.data);
      },
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'UserNotifications', id: 'LIST' }
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useGetUserNotificationsQuery,
  useCreateNotificationMutation,
  useCreateUserNotificationMutation,
  useUpdateNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkNotificationAsSentMutation,
  useDeleteNotificationMutation,
  useMarkAllUserNotificationsAsReadMutation,
  useDeleteReadUserNotificationsMutation,
  useSendBulkNotificationsMutation,
  useGetNotificationStatsQuery,
  useSendTestNotificationMutation,
} = notificationsApi;