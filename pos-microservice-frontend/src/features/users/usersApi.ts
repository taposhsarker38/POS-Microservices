// src/features/users/usersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User, CreateUserRequest, UpdateUserRequest } from './types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users/',
      providesTags: ['User'],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}/`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (userData) => ({
        url: 'users/',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: ({ id, ...userData }) => ({
        url: `users/${id}/`,
        method: 'PATCH',
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    resetUserPassword: builder.mutation<void, { id: string; newPassword: string }>({
      query: ({ id, newPassword }) => ({
        url: `users/${id}/reset-password/`,
        method: 'POST',
        body: { new_password: newPassword },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} = usersApi;