// src/store/types.ts
export interface NavItem {
  id: string;
  title: string;
  path: string | null;
  children?: NavItem[];
  parent?: string | null;
  order: number;
  permission_code?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface Company {
  id?: string;
  name: string;
  // extend as needed
}

export interface CompanySettings {
  logo?: string | null;
  primary_color?: string | null;
  // extend as needed
}

export interface User {
  id: string;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string | null;
  permissions?: string[];
  is_superuser?: boolean;
  is_active?: boolean;
  company_id?: string | null;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface TokenResponse {
  access: string;
  refresh?: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}
