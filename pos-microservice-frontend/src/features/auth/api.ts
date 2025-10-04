// features/auth/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  groups: string[];
  user_permissions: string[];
  last_login?: string;
  date_joined: string;
  company?: string;
}
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
    
    verifyToken: builder.mutation<{ valid: boolean }, string>({
      query: (token) => ({
        url: 'token/verify/',
        method: 'POST',
        body: { token },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useVerifyTokenMutation,
} = authApi;