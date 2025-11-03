
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { clearAuth, setAccessToken } from "./authSlice";
import { apiSlice } from "./api";
import Cookies from "js-cookie";
import { isJwtExpired } from "@/utils/auth";
import  ACCESS_COOKIE  from "./authSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
const access = Cookies.get("ACCESS_COOKIE");
if (access) {
  if (isJwtExpired(access)) {
    store.dispatch(clearAuth());
    // remove cookies if you want
    Cookies.remove("ACCESS_COOKIE");
  } else {
    // make sure state matches cookie
    store.dispatch(setAccessToken(access));
  }
}
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
