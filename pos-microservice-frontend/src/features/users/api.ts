// features/users/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '@/types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/`,
    credentials: 'include',
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users/',
      providesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;



// export const usersApi = createApi({
//   reducerPath: 'usersApi',
//   baseQuery: fetchBaseQuery({
//     baseUrl: `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/`,
//     credentials: 'include',
//     prepareHeaders: (headers, { getState }) => {
//       const token = (getState() as any).auth.accessToken;
//       if (token) {
//         headers.set('authorization', `Bearer ${token}`);
//       }
//       return headers;
//     },
//   }),
//   tagTypes: ['User', 'UserGroup'],
//   endpoints: (builder) => ({
//     // Users
//     getUsers: builder.query<User[], void>({
//       query: () => 'users/',
//       providesTags: ['User'],
//     }),
    
//     getUser: builder.query<User, string>({
//       query: (id) => `users/${id}/`,
//       providesTags: (result, error, id) => [{ type: 'User', id }],
//     }),
    
//     createUser: builder.mutation<User, CreateUserData>({
//       query: (userData) => ({
//         url: 'users/',
//         method: 'POST',
//         body: userData,
//       }),
//       invalidatesTags: ['User'],
//     }),
    
//     updateUser: builder.mutation<User, UpdateUserData>({
//       query: ({ id, ...userData }) => ({
//         url: `users/${id}/`,
//         method: 'PATCH',
//         body: userData,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: 'User', id },
//         'User',
//       ],
//     }),
    
//     deleteUser: builder.mutation<void, string>({
//       query: (id) => ({
//         url: `users/${id}/`,
//         method: 'DELETE',
//       }),
//       invalidatesTags: ['User'],
//     }),
    
//     // Groups and Permissions
//     getGroups: builder.query<UserGroup[], void>({
//       query: () => 'groups/',
//       providesTags: ['UserGroup'],
//     }),
    
//     createGroup: builder.mutation<UserGroup, { name: string; permissions: string[] }>({
//       query: (groupData) => ({
//         url: 'groups/',
//         method: 'POST',
//         body: groupData,
//       }),
//       invalidatesTags: ['UserGroup'],
//     }),
    
//     updateUserPermissions: builder.mutation<void, { userId: string; permissions: string[] }>({
//       query: ({ userId, permissions }) => ({
//         url: `users/${userId}/permissions/`,
//         method: 'PUT',
//         body: { permissions },
//       }),
//       invalidatesTags: ['User'],
//     }),
//   }),
// });