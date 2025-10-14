// src/store/api.ts
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAuth,setRefreshToken } from "./authSlice";
import { Mutex } from "async-mutex";
import type {
  User,
  Company,
  CompanySettings,
  NavItem,
  Role,
  TokenResponse,
} from "./type";

/**
 * Configuration
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";
const COMPANY_BASE = process.env.NEXT_PUBLIC_COMPANY_URL || "http://localhost:8002";
export const baseUrl = `${BASE}/api/v1/`;
export const companyUrl = `${COMPANY_BASE}/api/v1/`;

/**
 * Helper: is FormData
 */
const isFormData = (v: unknown): v is FormData => {
  return typeof FormData !== "undefined" && v instanceof FormData;
};

/**
 * prepareHeaders: don't set Content-Type globally because FormData needs browser to set boundary.
 */
const prepareHeaders = (headers: Headers, { getState }: { getState: () => unknown }) => {
  const token = (getState() as RootState).auth.accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // NOTE: don't set Content-Type here (FormData needs browser-set boundary)
  return headers;
};

/**
 * Base fetchers
 */
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

/**
 * Wrapper to allow FormData bodies (we assign a prepareHeaders override when body is FormData).
 * This returns a BaseQueryFn compatible function.
 */
const formAwareBase =
  (base: ReturnType<typeof fetchBaseQuery>): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    const modified = typeof args === "string" ? args : { ...args } as FetchArgs;
    if (typeof modified !== "string" && isFormData(modified.body)) {
      // override prepareHeaders so we don't set Content-Type
      // fetchBaseQuery accepts prepareHeaders per-call via `prepareHeaders` field
      // but types don't include it — but fetchBaseQuery handles it in runtime.
      // @ts-ignore
      modified.prepareHeaders = (headers: Headers) => {
        const token = (api.getState() as RootState).auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
      };
    }
    // @ts-ignore
    return base(modified, api, extraOptions);
  };

const baseQueryWithForm = formAwareBase(baseFetch);
const companyQueryWithForm = formAwareBase(companyFetch);

/**
 * Mutex for single-refresh semantics
 */
const mutex = new Mutex();

/**
 * Reauth wrapper
 */
const withReauth =
  (queryFn: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>) =>
  async (args: string | FetchArgs, api: any, extraOptions: any) => {
    await mutex.waitForUnlock();
    let result = await queryFn(args, api, extraOptions);
    if ((result as any)?.error?.status === 401) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          // call refresh endpoint (on main auth service)
          const refreshResult = await baseQueryWithForm(
            { url: "token/refresh/", method: "POST" } as FetchArgs,
            api,
            extraOptions,
          );
          if (refreshResult?.data) {
            const data = refreshResult.data as TokenResponse;
            if (data.access) {
              api.dispatch(setAccessToken(data.access));
            }
            if (data.refresh) {
              api.dispatch(setRefreshToken || (() => {})); // noop if not present
            }
          } else {
            api.dispatch(clearAuth());
          }
        } finally {
          release();
        }
      } else {
        await mutex.waitForUnlock();
      }
      // retry original
      result = await queryFn(args, api, extraOptions);
    }
    return result;
  };

const baseQueryWithReauth = withReauth(baseQueryWithForm);
const companyQueryWithReauth = withReauth(companyQueryWithForm);

/**
 * Create API slice.
 *
 * Note: For company-scoped endpoints we use `queryFn` and call companyQueryWithReauth directly.
 * For normal endpoints we use simple `query` definitions (RTK will pass them to baseQueryWithReauth).
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Company", "CompanySettings", "Nav", "Users", "Roles", "Inventory", "Product", "Account"],
  endpoints: (builder) => ({
    // AUTH
    login: builder.mutation<{ access: string; refresh?: string }, { username?: string; email?: string; password: string }>({
      query: (body) => ({ url: "token/", method: "POST", body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "logout/", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {}
        finally {
          dispatch(clearAuth());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),
    // whoami (simple GET)
    whoami: builder.query<User | null, void>({
      query: () => ({ url: "whoami/", method: "GET" }),
      providesTags: ["Me"],
    }),

    // COMPANY (use companyQueryWithReauth via queryFn to target different base)
    getCompany: builder.query<Company, string>({
      async queryFn(companyId, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${companyId}/`, method: "GET" }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as Company, meta: res.meta };
      },
      providesTags: ["Company"],
    }),
    updateCompany: builder.mutation<Company, { id: string; data: Partial<Company> }>({
      async queryFn({ id, data }, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${id}/`, method: "PATCH", body: data }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as Company, meta: res.meta };
      },
      invalidatesTags: ["Company"],
    }),
    getCompanySettings: builder.query<CompanySettings, string>({
      async queryFn(companyId, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies-settings-view/${companyId}/settings/`, method: "GET" }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as CompanySettings, meta: res.meta };
      },
      providesTags: ["CompanySettings"],
    }),
    updateCompanySettings: builder.mutation<CompanySettings, { company_id: string; data: FormData | Partial<CompanySettings> }>({
      async queryFn({ company_id, data }, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies-settings-view/${company_id}/settings/`, method: "PUT", body: data } as FetchArgs, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as CompanySettings, meta: res.meta };
      },
      invalidatesTags: ["CompanySettings"],
    }),

    // NAV
    getCompanyNav: builder.query<NavItem[], string>({
      async queryFn(companyId, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${companyId}/nav/`, method: "GET" }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as NavItem[], meta: res.meta };
      },
      providesTags: ["Nav"],
    }),
    createCompanyNav: builder.mutation<NavItem, { company_id: string; data: Partial<NavItem> }>({
      async queryFn({ company_id, data }, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${company_id}/nav/`, method: "POST", body: data }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as NavItem, meta: res.meta };
      },
      invalidatesTags: ["Nav"],
    }),
    updateCompanyNav: builder.mutation<NavItem, { company_id: string; nav_id: string; data: Partial<NavItem> }>({
      async queryFn({ company_id, nav_id, data }, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${company_id}/nav/${nav_id}/`, method: "PATCH", body: data }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: res.data as NavItem, meta: res.meta };
      },
      invalidatesTags: ["Nav"],
    }),
    deleteCompanyNav: builder.mutation<void, { company_id: string; nav_id: string }>({
      async queryFn({ company_id, nav_id }, api, extraOptions) {
        const res = await companyQueryWithReauth({ url: `companies/${company_id}/nav/${nav_id}/`, method: "DELETE" }, api, extraOptions);
        if (res.error) return { error: res.error as any };
        return { data: undefined, meta: res.meta };
      },
      invalidatesTags: ["Nav"],
    }),

    // Users & Roles (example simple endpoints using main base)
    getUsers: builder.query<User[], void>({
      query: () => ({ url: "users/", method: "GET" }),
      providesTags: ["Users"],
    }),
    getUser: builder.query<User, string>({
      query: (id) => ({ url: `users/${id}/`, method: "GET" }),
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (data) => ({ url: "users/", method: "POST", body: data }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({ url: `users/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `users/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),

    // Roles
    getRoles: builder.query<Role[], void>({
      query: () => ({ url: "roles/", method: "GET" }),
      providesTags: ["Roles"],
    }),
    getRole: builder.query<Role, string>({
      query: (id) => ({ url: `roles/${id}/`, method: "GET" }),
      providesTags: ["Roles"],
    }),
    createRole: builder.mutation<Role, Partial<Role>>({
      query: (data) => ({ url: "roles/", method: "POST", body: data }),
      invalidatesTags: ["Roles"],
    }),
    updateRole: builder.mutation<Role, { id: string; data: Partial<Role> }>({
      query: ({ id, data }) => ({ url: `roles/${id}/`, method: "PATCH", body: data }),
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
