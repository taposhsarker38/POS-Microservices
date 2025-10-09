export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  is_superuser: boolean;
}
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
export interface TokenResponse {
  access: string;
  refresh?: string;
}
