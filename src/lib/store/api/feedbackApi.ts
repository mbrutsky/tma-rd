import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { DatabaseFeedback, FeedbackType } from '@/src/lib/models/types';
import { currentUserId } from '../../app.config';

interface CreateFeedbackRequest {
  type: FeedbackType;
  to_user_id: string;
  task_id?: string;
  message: string;
}

function transformFeedback(item: any): DatabaseFeedback {
  return {
    id: item.id,
    type: item.type,
    from_user_id: item.from_user_id || item.fromUserId,
    to_user_id: item.to_user_id || item.toUserId,
    task_id: item.task_id || item.taskId,
    message: item.message,
    is_automatic: item.is_automatic || item.isAutomatic || false,
    created_at: new Date(item.created_at || item.createdAt),
    from_user: item.from_user || item.fromUser,
    to_user: item.to_user || item.toUser,
    task: item.task,
  };
}

export const feedbackApi = createApi({
  reducerPath: 'feedbackApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // ! To-Do
      headers.set('x-user-id', currentUserId);
      return headers;
    },
  }),
  tagTypes: ['Feedback'],
  endpoints: (builder) => ({
    getFeedback: builder.query<DatabaseFeedback[], {
      type?: FeedbackType;
      userId?: string;
      period?: 'week' | 'month' | 'all';
    }>({
      query: (params) => ({
        url: 'feedback',
        params: {
          type: params.type,
          userId: params.userId,
          period: params.period,
        },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformFeedback);
      },
      providesTags: ['Feedback'],
    }),

    createFeedback: builder.mutation<DatabaseFeedback, CreateFeedbackRequest>({
      query: (feedback) => ({
        url: 'feedback',
        method: 'POST',
        body: feedback,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformFeedback(response.data);
      },
      invalidatesTags: ['Feedback'],
    }),

    getUserFeedbackStats: builder.query<{
      userId: string;
      name: string;
      avatar?: string;
      gratitudes: number;
      remarks: number;
      score: number;
    }[], string[]>({
      query: (userIds) => ({
        url: 'feedback/stats',
        params: { userIds: userIds.join(',') },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data;
      },
      providesTags: ['Feedback'],
    }),
  }),
});

export const {
  useGetFeedbackQuery,
  useCreateFeedbackMutation,
  useGetUserFeedbackStatsQuery,
} = feedbackApi;