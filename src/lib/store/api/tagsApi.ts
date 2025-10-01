// lib/store/api/tagsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { currentUserId } from '../../app.config';

export interface Tag {
  name: string;
  count?: number;
}

export interface TagStatistics {
  tag: string;
  totalTasks: number;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  priorityDistribution: Array<{
    priority: number;
    count: number;
  }>;
}

export const tagsApi = createApi({
  reducerPath: 'tagsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // ! To-Do
      headers.set('x-user-id', currentUserId);
      return headers;
    },
  }),
  tagTypes: ['Tag'],
  endpoints: (builder) => ({
    getTags: builder.query<Tag[], {
      search?: string;
      limit?: number;
      includeCount?: boolean;
    }>({
      query: (params) => ({
        url: 'tags',
        params: {
          search: params.search,
          limit: params.limit?.toString(),
          includeCount: params.includeCount?.toString(),
        },
      }),
      transformResponse: (response: { success: boolean; data: Tag[]; total: number }) => {
        return response.data;
      },
      providesTags: ['Tag'],
      // Кешируем результат на 5 минут
      keepUnusedDataFor: 300,
    }),

    getTagStatistics: builder.mutation<TagStatistics[], string[]>({
      query: (tags) => ({
        url: 'tags',
        method: 'POST',
        body: {
          action: 'statistics',
          tags,
        },
      }),
      transformResponse: (response: { success: boolean; data: TagStatistics[] }) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetTagsQuery,
  useGetTagStatisticsMutation,
} = tagsApi;