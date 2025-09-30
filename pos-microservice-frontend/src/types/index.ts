// types/index.ts
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

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}