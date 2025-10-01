import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { DatabaseUser, CreateUserRequest } from '@/src/lib/models/types';
import { currentUserId } from '../../app.config';

function transformDatabaseUserToFrontend(dbUser: DatabaseUser): DatabaseUser {
  return {
  id: dbUser.id,
  name: dbUser.name,
  username: dbUser.username,
  avatar: dbUser.avatar,
  role: dbUser.role as any,
  position: dbUser.position,
  email: dbUser.email,
  phone: dbUser.phone,
  is_active: dbUser.is_active,
  simplified_control: dbUser.simplified_control,
  notification_settings: dbUser.notification_settings,
  created_at: dbUser.created_at,
  updated_at: dbUser.updated_at
};
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // ! tO-do
      headers.set('x-user-id', currentUserId);
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<DatabaseUser[], { active?: boolean }>({
      query: (params) => ({
        url: 'users',
        params: {
          active: params.active?.toString(),
        },
      }),
      transformResponse: (response: { success: boolean; data: DatabaseUser[] }) => {
        return response.data.map(transformDatabaseUserToFrontend);
      },
      providesTags: ['User'],
    }),
    
    getUser: builder.query<DatabaseUser, string>({
      query: (id) => `users/${id}`,
      transformResponse: (response: { success: boolean; data: DatabaseUser }) => {
        return transformDatabaseUserToFrontend(response.data);
      },
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    createUser: builder.mutation<DatabaseUser, CreateUserRequest>({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: user,
      }),
      transformResponse: (response: { success: boolean; data: DatabaseUser }) => {
        return transformDatabaseUserToFrontend(response.data);
      },
      invalidatesTags: ['User'],
    }),
    
    updateUser: builder.mutation<DatabaseUser, { id: string; updates: Partial<CreateUserRequest> }>({
      query: ({ id, updates }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: DatabaseUser }) => {
        return transformDatabaseUserToFrontend(response.data);
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = usersApi;