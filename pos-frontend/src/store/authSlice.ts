// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import type { AuthState, TokenResponse } from "./type";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const loadTokenFromCookies = (): string | null => {
  if (typeof window === "undefined") return null;
  return Cookies.get(ACCESS_COOKIE) || null;
};

const initialState: AuthState = {
  accessToken: loadTokenFromCookies(),
  refreshToken: typeof window !== "undefined" ? Cookies.get(REFRESH_COOKIE) || null : null,
  isAuthenticated: !!loadTokenFromCookies(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        Cookies.set(ACCESS_COOKIE, action.payload, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
      if (typeof window !== "undefined") {
        Cookies.set(REFRESH_COOKIE, action.payload, {
          expires: 30,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    },
    setTokens: (state, action: PayloadAction<TokenResponse>) => {
      state.accessToken = action.payload.access;
      state.isAuthenticated = true;
      if (action.payload.refresh) state.refreshToken = action.payload.refresh;
      if (typeof window !== "undefined") {
        Cookies.set(ACCESS_COOKIE, action.payload.access, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        if (action.payload.refresh) {
          Cookies.set(REFRESH_COOKIE, action.payload.refresh, {
            expires: 30,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }
      }
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        Cookies.remove(ACCESS_COOKIE);
        Cookies.remove(REFRESH_COOKIE);
      }
    },
  },
});

export const { setAccessToken, setRefreshToken, setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;
