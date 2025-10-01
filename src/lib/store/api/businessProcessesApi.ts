import { createApi } from '@reduxjs/toolkit/query/react';
import { DatabaseBusinessProcess, CreateBusinessProcessRequest } from '@/src/lib/models/types';
import { baseQueryWithAuth } from './baseQuery';

function transformDatabaseProcessToFrontend(dbProcess: any): DatabaseBusinessProcess {
  return {
    id: dbProcess.id,
    name: dbProcess.name,
    description: dbProcess.description || '',
    creator_id: dbProcess.creatorId || dbProcess.creator_id,
    is_active: dbProcess.isActive !== undefined ? dbProcess.isActive : dbProcess.is_active,
    company_id: dbProcess.companyId || dbProcess.company_id,
    created_at: new Date(dbProcess.createdAt || dbProcess.created_at),
    updated_at: new Date(dbProcess.updatedAt || dbProcess.updated_at),
    creator: dbProcess.creator,
  };
}

export const businessProcessesApi = createApi({
  reducerPath: 'businessProcessesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['BusinessProcess'],
  endpoints: (builder) => ({
    getBusinessProcesses: builder.query<DatabaseBusinessProcess[], { active?: boolean }>({
      query: (params) => ({
        url: 'business-processes',
        params: {
          active: params.active?.toString(),
        },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformDatabaseProcessToFrontend);
      },
      providesTags: ['BusinessProcess'],
    }),
    
    createBusinessProcess: builder.mutation<DatabaseBusinessProcess, CreateBusinessProcessRequest>({
      query: (process) => ({
        url: 'business-processes',
        method: 'POST',
        body: process,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseProcessToFrontend(response.data);
      },
      invalidatesTags: ['BusinessProcess'],
    }),
    
    updateBusinessProcess: builder.mutation<DatabaseBusinessProcess, { id: string; updates: Partial<CreateBusinessProcessRequest> }>({
      query: ({ id, updates }) => ({
        url: `business-processes/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseProcessToFrontend(response.data);
      },
      invalidatesTags: ['BusinessProcess'],
    }),
    
    deleteBusinessProcess: builder.mutation<void, string>({
      query: (id) => ({
        url: `business-processes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BusinessProcess'],
    }),
  }),
});

export const {
  useGetBusinessProcessesQuery,
  useCreateBusinessProcessMutation,
  useUpdateBusinessProcessMutation,
  useDeleteBusinessProcessMutation,
} = businessProcessesApi;