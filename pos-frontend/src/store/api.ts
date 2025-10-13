import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAuth } from "./authSlice";
import { Mutex } from "async-mutex";

type NavItem = {
  id: string;
  title: string;
  path: string | null;
  children?: NavItem[];
  parent?: string | null;
  order: number;
  permission_code?: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

type Company = {
  name: string;
  // add other fields as needed
};

type CompanySettings = {
  logo?: string;
  primary_color?: string;
  // add other fields as needed
};

type User = {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  is_active?: boolean;
  company_id?: string;
  role?: string | null;
  permissions?: string[];
};

type Role = {
  id: string;
  name: string;
  permissions: string[];
};

// Use port 8001 based on your API test
const baseUrl =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001") + "/api/v1/";
const companyUrl =
  (process.env.NEXT_PUBLIC_COMPANY_URL || "http://localhost:8001") + "/api/v1/";

console.log("🔧 API Configuration:");
console.log("Base URL:", baseUrl);
console.log("Company URL:", companyUrl);

const prepareHeaders = (
  headers: Headers,
  { getState }: { getState: () => unknown },
) => {
  const token = (getState() as RootState).auth.accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return headers;
};

const baseFetch = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders,
});

const companyFetch = fetchBaseQuery({
  baseUrl: companyUrl,
  credentials: "include",
  prepareHeaders,
});

const handleForm =
  (base: typeof baseFetch) =>
  async (args: any, api: any, extraOptions: any) => {
    let modifiedArgs = { ...args };
    if (modifiedArgs.body instanceof FormData) {
      modifiedArgs.prepareHeaders = (headers: Headers) => {
        const token = (api.getState() as RootState).auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
      };
    }
    return base(modifiedArgs, api, extraOptions);
  };

const baseQueryWithForm = handleForm(baseFetch);
const companyQueryWithForm = handleForm(companyFetch);

const mutex = new Mutex();

const withReauth =
  (queryWithForm: typeof baseQueryWithForm, isCompany: boolean = false) =>
  async (args: any, api: any, extraOptions: any) => {
    await mutex.waitForUnlock();
    let result = await queryWithForm(args, api, extraOptions);
    if (result?.error?.status === 401) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          const refreshResult = await baseQueryWithForm(
            { url: "token/refresh/", method: "POST" },
            api,
            extraOptions,
          );
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
      result = await queryWithForm(args, api, extraOptions);
    }
    return result;
  };

const baseQueryWithReauth = withReauth(baseQueryWithForm);
const companyQueryWithReauth = withReauth(companyQueryWithForm, true);

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "Company",
    "Inventory",
    "Product",
    "Account",
    "CompanySettings",
    "Nav",
    "Users",
    "Roles",
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (body) => ({ url: "token/", method: "POST", body }),
    }),
    passwordreset: builder.mutation({
      query: (body) => ({ url: "password-reset/", method: "POST", body }),
    }),
    passwordresetconfirm: builder.mutation({
      query: (body) => ({
        url: "password-reset/confirm/",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "logout/", method: "POST" }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          console.warn("Logout request failed", err);
        } finally {
          dispatch(clearAuth());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),
    whoami: builder.query<User, void>({
      queryFn: async (_arg, api, extraOptions) => {
        const result = await baseQueryWithReauth(
          { url: "whoami/", method: "GET" },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as User, meta: result.meta };
      },
      providesTags: ["Me"],
    }),

    // Company endpoints
    getCompany: builder.query<Company, string>({
      queryFn: async (id, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${id}/` },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as Company, meta: result.meta };
      },
      providesTags: ["Company"],
    }),
    updateCompany: builder.mutation<
      Company,
      { id: string; data: Partial<Company> }
    >({
      queryFn: async ({ id, data }, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${id}/`, method: "PATCH", body: data },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as Company, meta: result.meta };
      },
      invalidatesTags: ["Company"],
    }),
    getCompanySettings: builder.query<CompanySettings, string>({
      queryFn: async (company_id, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies-settings-view/${company_id}/settings/` },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CompanySettings, meta: result.meta };
      },
      providesTags: ["CompanySettings"],
    }),
    updateCompanySettings: builder.mutation<
      CompanySettings,
      { company_id: string; data: FormData | Partial<CompanySettings> }
    >({
      queryFn: async ({ company_id, data }, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          {
            url: `companies-settings-view/${company_id}/settings/`,
            method: "PUT",
            body: data,
          },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as CompanySettings, meta: result.meta };
      },
      invalidatesTags: ["CompanySettings"],
    }),
    getCompanyNav: builder.query<NavItem[], string>({
      queryFn: async (company_id, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${company_id}/nav/` },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as NavItem[], meta: result.meta };
      },
      providesTags: ["Nav"],
    }),
    createCompanyNav: builder.mutation<
      NavItem,
      { company_id: string; data: Partial<NavItem> }
    >({
      queryFn: async ({ company_id, data }, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${company_id}/nav/`, method: "POST", body: data },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as NavItem, meta: result.meta };
      },
      invalidatesTags: ["Nav"],
    }),
    updateCompanyNav: builder.mutation<
      NavItem,
      { company_id: string; nav_id: string; data: Partial<NavItem> }
    >({
      queryFn: async ({ company_id, nav_id, data }, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          {
            url: `companies/${company_id}/nav/${nav_id}/`,
            method: "PATCH",
            body: data,
          },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as NavItem, meta: result.meta };
      },
      invalidatesTags: ["Nav"],
    }),
    deleteCompanyNav: builder.mutation<
      void,
      { company_id: string; nav_id: string }
    >({
      queryFn: async ({ company_id, nav_id }, api, extraOptions) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${company_id}/nav/${nav_id}/`, method: "DELETE" },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error };
        }
        return { data: undefined, meta: result.meta };
      },
      invalidatesTags: ["Nav"],
    }),

    // User Management (Superuser only)
    getUsers: builder.query<User[], void>({
      query: () => "users/",
      providesTags: ["Users"],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}/`,
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (data) => ({ url: "users/", method: "POST", body: data }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `users/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),

    // Role & Permission Management (Superuser only)
    getRoles: builder.query<Role[], void>({
      query: () => "roles/",
      providesTags: ["Roles"],
    }),
    getRole: builder.query<Role, string>({
      query: (id) => `roles/${id}/`,
      providesTags: ["Roles"],
    }),
    createRole: builder.mutation<Role, Partial<Role>>({
      query: (data) => ({ url: "roles/", method: "POST", body: data }),
      invalidatesTags: ["Roles"],
    }),
    updateRole: builder.mutation<Role, { id: string; data: Partial<Role> }>({
      query: ({ id, data }) => ({
        url: `roles/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({ url: `roles/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useLoginMutation,
  usePasswordresetMutation,
  usePasswordresetconfirmMutation,
  useLogoutMutation,
  useWhoamiQuery,
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
  useGetCompanyNavQuery,
  useCreateCompanyNavMutation,
  useUpdateCompanyNavMutation,
  useDeleteCompanyNavMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = apiSlice;
