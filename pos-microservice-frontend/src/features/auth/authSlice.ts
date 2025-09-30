// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from './authApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
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
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.user;
          state.accessToken = payload.access;
          state.refreshToken = payload.refresh;
        }
      )
      .addMatcher(
        authApi.endpoints.refreshToken.matchFulfilled,
        (state, { payload }) => {
          state.accessToken = payload.access;
        }
      )
      .addMatcher(
        authApi.endpoints.logout.matchFulfilled,
        (state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
        }
      );
  },
});

export const { setCredentials, logout, setInitialized } = authSlice.actions;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  !!state.auth.accessToken && !!state.auth.user;

export default authSlice.reducer;