// src/lib/store/api/telegramGroupsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from './baseQuery';

export interface TelegramGroup {
  id: string;
  companyId: string;
  chatId: string;
  providerType: string;
  providerConfigId: string;
  defaultAssigneeOption: string | null;
  defaultAssigneeName: string | null;
  defaultAssigneePosition: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTelegramGroupRequest {
  id: string;
  isActive?: boolean;
  defaultAssigneeOption?: string | null;
}

export const telegramGroupsApi = createApi({
  reducerPath: "telegramGroupsApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["TelegramGroup"],
  endpoints: (builder) => ({
    getTelegramGroups: builder.query<TelegramGroup[], void>({
      query: () => ({
        url: 'telegram-groups',
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: TelegramGroup[] }) => {
        if (!response.success) {
          throw new Error('Failed to fetch Telegram groups');
        }
        return response.data;
      },
      providesTags: ['TelegramGroup'],
    }),

    updateTelegramGroup: builder.mutation<TelegramGroup, UpdateTelegramGroupRequest>({
      query: (body) => ({
        url: 'telegram-groups',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { success: boolean; data: TelegramGroup }) => {
        if (!response.success) {
          throw new Error('Failed to update Telegram group');
        }
        return response.data;
      },
      invalidatesTags: ['TelegramGroup'],
    }),
  }),
});

export const {
  useGetTelegramGroupsQuery,
  useUpdateTelegramGroupMutation,
} = telegramGroupsApi;