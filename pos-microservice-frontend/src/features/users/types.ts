import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// import { User, CreateUserData, UpdateUserData, UserGroup } from './types';
// features/users/types.ts
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  groups: string[];
  user_permissions: string[];
  company: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

export interface UserGroup {
  id: string;
  name: string;
  permissions: string[];
}
interface User {
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
// features/users/api.ts
