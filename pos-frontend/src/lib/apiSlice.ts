import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000") + "/api/v1/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl, credentials: "include" }),
  tagTypes: ["Me", "Company", "Inventory"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: "token/", method: "POST", body }),
    }),
    refresh: builder.mutation({
      query: () => ({ url: "token/refresh/", method: "POST" }),
    }),
    whoami: builder.query({ query: () => "whoami/", providesTags: ["Me"] }),
    logout: builder.mutation({
      query: () => ({ url: "logout/", method: "POST" }),
    }),
    getCompanies: builder.query({
      query: () => "companies/",
      providesTags: ["Company"],
    }),
    getCompanyNav: builder.query({
      query: (id: string) => `/companies/${id}/nav/`,
    }),
    getInventory: builder.query({
      query: () => "/inventory/",
      providesTags: ["Inventory"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useWhoamiQuery,
  useLogoutMutation,
  useGetCompaniesQuery,
  useGetCompanyNavQuery,
  useGetInventoryQuery,
} = apiSlice;
