// features/auth/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '@/types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/`,
    credentials: 'include',
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: 'token/',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'logout/',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    
    getMe: builder.query<User, void>({
      query: () => 'whoami/',
      providesTags: ['Auth'],
    }),
    
    refreshToken: builder.mutation<{ access: string }, void>({
      query: () => ({
        url: 'token/refresh/',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
} = authApi;