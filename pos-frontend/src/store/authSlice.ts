import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// Load token from cookies on initial load
const loadTokenFromCookies = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get('access_token') || Cookies.get('accessToken') || null;
};

const initialState: AuthState = {
  accessToken: loadTokenFromCookies(),
  refreshToken: Cookies.get('refresh_token') || Cookies.get('refreshToken') || null,
  isAuthenticated: !!loadTokenFromCookies(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      
      // Persist to cookies
      if (typeof window !== 'undefined') {
        Cookies.set('access_token', action.payload, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
      
      // Persist to cookies
      if (typeof window !== 'undefined') {
        Cookies.set('refresh_token', action.payload, {
          expires: 30, // 30 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    },
    setTokens: (state, action: PayloadAction<{ access: string; refresh?: string }>) => {
      state.accessToken = action.payload.access;
      state.isAuthenticated = true;
      
      if (action.payload.refresh) {
        state.refreshToken = action.payload.refresh;
      }
      
      // Persist to cookies
      if (typeof window !== 'undefined') {
        Cookies.set('access_token', action.payload.access, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        
        if (action.payload.refresh) {
          Cookies.set('refresh_token', action.payload.refresh, {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
        }
      }
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Clear cookies
      if (typeof window !== 'undefined') {
        Cookies.remove('access_token');
        Cookies.remove('accessToken');
        Cookies.remove('refresh_token');
        Cookies.remove('refreshToken');
      }
    },
  },
});

export const { setAccessToken, setRefreshToken, setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;