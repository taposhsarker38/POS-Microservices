import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isInitialized = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isInitialized = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  setUser,
  logout,
  setLoading,
  setInitialized,
} = authSlice.actions;

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  !!state.auth.accessToken && !!state.auth.user;

export default authSlice.reducer;