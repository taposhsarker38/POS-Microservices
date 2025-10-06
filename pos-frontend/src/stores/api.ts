// src/store/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAuth } from "./authSlice";
import { Mutex } from "async-mutex";

const baseUrl = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000") + "/api/v1/";

const baseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include", // important if refresh uses HttpOnly cookie
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

const mutex = new Mutex();

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  // wait if another refresh is in progress
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // try to acquire mutex to perform refresh
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
      // wait for the ongoing refresh to finish
      await mutex.waitForUnlock();
    }
    // retry original request after refresh attempt
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
    whoami: builder.query({ query: () => "whoami/", providesTags: ["Me"] }),
    getInventory: builder.query({ query: () => "inventory/", providesTags: ["Inventory"] }),
    getProducts: builder.query({ query: () => "products/", providesTags: ["Product"] }),
    // add other endpoints: accounts, sales, invoices, etc.
  }),
});

export const {
  useLoginMutation,
  useWhoamiQuery,
  useGetInventoryQuery,
  useGetProductsQuery,
} = apiSlice;
