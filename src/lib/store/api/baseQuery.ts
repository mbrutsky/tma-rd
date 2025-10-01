// src/lib/store/api/baseQuery.ts

import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Создаем базовый query с автоматическим добавлением токена
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Получаем токен и userId из localStorage при каждом запросе
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  // Создаем baseQuery с заголовками
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      if (userId) {
        headers.set('x-user-id', userId);
      }
      return headers;
    },
  });
  
  return rawBaseQuery(args, api, extraOptions);
};