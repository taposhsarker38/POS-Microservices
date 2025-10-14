
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import type { TokenResponse } from "./type"; // adjust path if your types live elsewhere

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
};

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

const cookieOpts = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as "lax",
  path: "/" as "/",
};

const refreshCookieOpts = {
  expires: 30,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as "lax",
  path: "/" as "/",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      // guard: don't store falsy or "undefined" string
      if (!action.payload || action.payload === "undefined") return;
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        Cookies.set(ACCESS_COOKIE, action.payload, cookieOpts);
      }
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      if (!action.payload || action.payload === "undefined") return;
      state.refreshToken = action.payload;
      if (typeof window !== "undefined") {
        Cookies.set(REFRESH_COOKIE, action.payload, refreshCookieOpts);
      }
    },
    setTokens: (state, action: PayloadAction<TokenResponse>) => {
      if (action.payload.access && action.payload.access !== "undefined") {
        state.accessToken = action.payload.access;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          Cookies.set(ACCESS_COOKIE, action.payload.access, cookieOpts);
        }
      }
      if (action.payload.refresh && action.payload.refresh !== "undefined") {
        state.refreshToken = action.payload.refresh;
        if (typeof window !== "undefined") {
          Cookies.set(REFRESH_COOKIE, action.payload.refresh, refreshCookieOpts);
        }
      }
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        Cookies.remove(ACCESS_COOKIE, { path: "/" });
        Cookies.remove(REFRESH_COOKIE, { path: "/" });
      }
    },
  },
});

export const { setAccessToken, setRefreshToken, setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;
