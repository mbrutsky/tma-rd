// src/lib/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tasksApi } from './api/tasksApi';
import { usersApi } from './api/usersApi';
import { businessProcessesApi } from './api/businessProcessesApi';
import { feedbackApi } from './api/feedbackApi';
import { companiesApi } from './api/companiesApi';
import { notificationsApi } from './api/notificationsApi';
import { tagsApi } from './api/tagsApi';
import { telegramGroupsApi } from './api/telegramGroupsApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    // Обычные slices
    auth: authReducer,
    
    // RTK Query API slices
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [businessProcessesApi.reducerPath]: businessProcessesApi.reducer,
    [feedbackApi.reducerPath]: feedbackApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [telegramGroupsApi.reducerPath]: telegramGroupsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Auth slice actions
          'auth/setTelegramWebApp',
          'auth/authenticateWithTelegram/fulfilled',
          
          // RTK Query actions
          'tasksApi/executeQuery/fulfilled',
          'tasksApi/executeQuery/pending',
          'tasksApi/executeQuery/rejected',
          'tasksApi/executeMutation/fulfilled',
          'tasksApi/executeMutation/pending',
          'tasksApi/executeMutation/rejected',
          'usersApi/executeQuery/fulfilled',
          'usersApi/executeQuery/pending',
          'usersApi/executeQuery/rejected',
          'businessProcessesApi/executeQuery/fulfilled',
          'businessProcessesApi/executeQuery/pending',
          'businessProcessesApi/executeQuery/rejected',
          'notificationsApi/executeQuery/fulfilled',
          'notificationsApi/executeQuery/pending',
          'notificationsApi/executeQuery/rejected',
          'feedbackApi/executeQuery/fulfilled',
          'feedbackApi/executeQuery/pending',
          'feedbackApi/executeQuery/rejected',
          'companiesApi/executeQuery/fulfilled',
          'companiesApi/executeQuery/pending',
          'companiesApi/executeQuery/rejected',
          'tagsApi/executeQuery/fulfilled',
          'tagsApi/executeQuery/pending',
          'tagsApi/executeQuery/rejected',
          'telegramGroupsApi/executeQuery/fulfilled',
          'telegramGroupsApi/executeQuery/pending',
          'telegramGroupsApi/executeQuery/rejected',
          '__rtkq/focused',
          '__rtkq/unfocused',
          '__rtkq/online',
          '__rtkq/offline',
          // Persist actions if you use redux-persist
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        ignoredActionPaths: [
          'meta.arg',
          'meta.baseQueryMeta',
          'payload.timestamp',
          'payload.data',
          'payload.telegramWebApp',
        ],
        ignoredPaths: [
          // Auth state paths
          'auth.telegramWebApp',
          
          // Ignore Date objects in API responses
          'tasksApi.queries',
          'tasksApi.mutations',
          'usersApi.queries',
          'businessProcessesApi.queries',
          'notificationsApi.queries',
          'feedbackApi.queries',
          'companiesApi.queries',
          'tagsApi.queries',
          'telegramGroupsApi.queries',
        ],
      },
    })
      .concat(
        tasksApi.middleware,
        usersApi.middleware,
        businessProcessesApi.middleware,
        feedbackApi.middleware,
        companiesApi.middleware,
        notificationsApi.middleware,
        tagsApi.middleware,
        telegramGroupsApi.middleware,
      )
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;