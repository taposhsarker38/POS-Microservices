
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAuth } from "./authSlice";
import { Mutex } from "async-mutex";
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000") + "/api/v1/";

const baseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});
const mutex = new Mutex();
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  if (result?.error?.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery({ url: "token/refresh/", method: "POST" }, api, extraOptions);
        if (refreshResult?.data) {
          const newAccess = (refreshResult.data as any).access;
          api.dispatch(setAccessToken(newAccess));
        } else {
          api.dispatch(clearAuth());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
    }
    result = await baseQuery(args, api, extraOptions);
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Company", "Inventory", "Product", "Account"],
  endpoints: (builder) => ({
    login: builder.mutation({ query: (body) => ({ url: "token/", method: "POST", body }) }),
    logout: builder.mutation<void, void>({
  query: () => ({ url: 'logout/', method: 'POST' }),
  async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    try {
      await queryFulfilled; // wait for server to respond (and send Set-Cookie)
    } catch (err) {
      // server error — still clear local state as fallback
      console.warn('Logout request failed', err);
    } finally {
      // always clear client-side auth state & reset api cache
      dispatch(clearAuth());
      dispatch(apiSlice.util.resetApiState());
    }
  },
}),
    whoami: builder.query({ query: () => "whoami/", providesTags: ["Me"] }),

  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useWhoamiQuery,
} = apiSlice;
