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

export type Company = {
  id: string;
  name: string;
  code: string;
  tax_number?: string;
  vat_rate?: string;
  bin_number?: string;
  accounting_codes?: Record<string, any>;
  default_payment_terms?: string;
  address?: string;
  timezone?: string;
  metadata?: Record<string, any>;
  created_at: string;
};

export type CompanySettings = {
  id?: string;
  company: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  logo?: string;
  logo_dark?: string;
  favicon?: string;
  nav?: any[];
  metadata?: Record<string, any>;
  feature_flags?: Record<string, any>;
  ui_schema?: Record<string, any>;
  updated_at?: string;
};

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
