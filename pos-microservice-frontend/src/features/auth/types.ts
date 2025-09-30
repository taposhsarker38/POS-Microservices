export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

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