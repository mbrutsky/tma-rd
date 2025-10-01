// lib/store/api/companiesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { DatabaseCompany, CreateCompanyRequest, UpdateCompanyRequest } from '@/src/lib/models/types';
import { currentUserId } from '../../app.config';

function transformDatabaseCompanyToFrontend(dbCompany: any): DatabaseCompany {
  return {
    id: dbCompany.id,
    director_telegram_user_id: dbCompany.director_telegram_user_id,
    director_telegram_username: dbCompany.director_telegram_username,
    director_app_user_id: dbCompany.director_app_user_id,
    plan: dbCompany.plan,
    employee_user_ids: dbCompany.employee_user_ids || [],
    connected_at: new Date(dbCompany.connected_at),
    created_at: new Date(dbCompany.created_at),
    updated_at: new Date(dbCompany.updated_at),
    director: dbCompany.director,
    employees: dbCompany.employees || [],
  };
}

export const companiesApi = createApi({
  reducerPath: 'companiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      headers.set('x-user-id', currentUserId);
      return headers;
    },
  }),
  tagTypes: ['Company'],
  endpoints: (builder) => ({
    getCompanies: builder.query<DatabaseCompany[], void>({
      query: () => 'companies',
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformDatabaseCompanyToFrontend);
      },
      providesTags: ['Company'],
    }),
    
    getCompany: builder.query<DatabaseCompany, string>({
      query: (id) => `companies/${id}`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    
    getCurrentUserCompany: builder.query<DatabaseCompany, void>({
      query: () => 'companies/current',
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      providesTags: [{ type: 'Company', id: 'CURRENT' }],
    }),
    
    createCompany: builder.mutation<DatabaseCompany, CreateCompanyRequest>({
      query: (company) => ({
        url: 'companies',
        method: 'POST',
        body: company,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      invalidatesTags: ['Company'],
    }),
    
    updateCompany: builder.mutation<DatabaseCompany, { id: string; updates: UpdateCompanyRequest }>({
      query: ({ id, updates }) => ({
        url: `companies/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Company', id }, 'Company'],
    }),
    
    // Добавить сотрудника в компанию
    addEmployee: builder.mutation<DatabaseCompany, { companyId: string; userId: string }>({
      query: ({ companyId, userId }) => ({
        url: `companies/${companyId}/employees`,
        method: 'POST',
        body: { userId },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      invalidatesTags: (result, error, { companyId }) => [{ type: 'Company', id: companyId }, 'Company'],
    }),
    
    // Удалить сотрудника из компании
    removeEmployee: builder.mutation<DatabaseCompany, { companyId: string; userId: string }>({
      query: ({ companyId, userId }) => ({
        url: `companies/${companyId}/employees/${userId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      invalidatesTags: (result, error, { companyId }) => [{ type: 'Company', id: companyId }, 'Company'],
    }),
    
    // Изменить тарифный план
    updatePlan: builder.mutation<DatabaseCompany, { companyId: string; plan: 'free' | 'pro' }>({
      query: ({ companyId, plan }) => ({
        url: `companies/${companyId}/plan`,
        method: 'PUT',
        body: { plan },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseCompanyToFrontend(response.data);
      },
      invalidatesTags: (result, error, { companyId }) => [{ type: 'Company', id: companyId }, 'Company'],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useGetCurrentUserCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useAddEmployeeMutation,
  useRemoveEmployeeMutation,
  useUpdatePlanMutation,
} = companiesApi;