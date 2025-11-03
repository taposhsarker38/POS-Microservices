// api.ts
import Cookies from "js-cookie";
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAuth, setRefreshToken } from "./authSlice";
import { Mutex } from "async-mutex";
import type {
  User,
  Company,
  CompanySettings,
  NavItem,
  Role,
  TokenResponse,
} from "./type";

type FetchArgsWithPrepare = FetchArgs & {
  prepareHeaders?: (headers: Headers) => Headers | Promise<Headers>;
};

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";
const COMPANY_BASE =
  process.env.NEXT_PUBLIC_COMPANY_URL || "http://localhost:8002";
export const baseUrl = `${BASE}/api/v1/`;
export const companyUrl = `${COMPANY_BASE}/api/v1/`;

const isFormData = (v: unknown): v is FormData => {
  return typeof FormData !== "undefined" && v instanceof FormData;
};
const validCookie = (v: string | undefined | null) => !!v && v !== "undefined";

const prepareHeaders = (
  headers: Headers,
  { getState }: { getState: () => unknown },
) => {
  const tokenFromStore = (getState() as RootState).auth?.accessToken || null;
  // backend sometimes sets cookie named "access" (check both)
  const serverCookie =
    typeof window !== "undefined" ? Cookies.get("access") || null : null;
  const clientCookie =
    typeof window !== "undefined" ? Cookies.get(ACCESS_COOKIE) || null : null;

  const token =
    tokenFromStore ||
    (validCookie(serverCookie)
      ? serverCookie
      : validCookie(clientCookie)
        ? clientCookie
        : null);

  if (typeof window !== "undefined") {
    console.debug("[prepareHeaders] tokens:", {
      tokenFromStore: !!tokenFromStore,
      serverCookie: !!serverCookie,
      clientCookie: !!clientCookie,
    });
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);
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

const formAwareBase =
  (base: ReturnType<typeof fetchBaseQuery>) =>
  async (args: string | FetchArgs, api: any, extraOptions: any) => {
    const modified = typeof args === "string" ? args : ({ ...args } as FetchArgsWithPrepare);

    if (typeof modified !== "string" && isFormData((modified as any).body)) {
      modified.prepareHeaders = (headers: Headers) => {
        const token = (api.getState() as RootState).auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
      };
    }
    return base(modified as unknown as FetchArgs, api, extraOptions);
  };

const baseQueryWithForm = formAwareBase(baseFetch);
const companyQueryWithForm = formAwareBase(companyFetch);

const mutex = new Mutex();

/**
 * Normalize different possible refresh responses into { access?, refresh? }
 * Covers common shapes like:
 * - { access: '...', refresh: '...' }
 * - { access_token: '...', refresh_token: '...' }
 * - { token: { access: '...', refresh: '...' } }
 */
const normalizeTokenData = (data: any): TokenResponse | null => {
  if (!data) return null;
  if (typeof data !== "object") return null;

  // common django rest simplejwt shape
  if (data.access || data.refresh) {
    return { access: data.access, refresh: data.refresh };
  }

  // alternate keys
  if (data.access_token || data.refresh_token) {
    return { access: data.access_token, refresh: data.refresh_token };
  }

  // nested token
  if (data.token && (data.token.access || data.token.refresh)) {
    return { access: data.token.access, refresh: data.token.refresh };
  }

  return null;
};

const withReauth =
  (queryFn: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>) =>
  async (args: string | FetchArgs, api: any, extraOptions: any) => {
    // ensure any ongoing refresh completes first
    await mutex.waitForUnlock();
    let result = await queryFn(args, api, extraOptions);

    // If unauthorized, attempt refresh (with mutex to avoid concurrent refreshes)
    if ((result as any)?.error?.status === 401) {
      // Acquire lock to perform refresh if not already locked
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          // Try to refresh tokens:
          // If we have a client-side refresh token, send it in body.
          // Otherwise rely on httpOnly cookie (credentials: "include" is set on base fetch).
          const refreshToken = (api.getState() as RootState).auth?.refreshToken || null;

          const refreshArgs: FetchArgs = refreshToken
            ? { url: "token/refresh/", method: "POST", body: { refresh: refreshToken } }
            : { url: "token/refresh/", method: "POST" };

          const refreshResult = await baseQueryWithForm(refreshArgs, api, extraOptions);

          if (refreshResult?.data) {
            const tokenData = normalizeTokenData(refreshResult.data);
            if (tokenData) {
              if (tokenData.access && tokenData.access !== "undefined") {
                api.dispatch(setAccessToken(tokenData.access));
              }
              if (tokenData.refresh && tokenData.refresh !== "undefined") {
                api.dispatch(setRefreshToken(tokenData.refresh));
              }
            } else {
              // If server response not in expected shape, still try to read common keys directly
              // Fallbacks already handled in normalizeTokenData; if nothing, clear auth.
              api.dispatch(clearAuth());
              if (typeof window !== "undefined") {
                Cookies.remove(ACCESS_COOKIE, { path: "/" });
                Cookies.remove(REFRESH_COOKIE, { path: "/" });
              }
            }
          } else {
            // refresh failed
            api.dispatch(clearAuth());
            if (typeof window !== "undefined") {
              Cookies.remove(ACCESS_COOKIE, { path: "/" });
              Cookies.remove(REFRESH_COOKIE, { path: "/" });
            }
          }
        } finally {
          release();
        }
      } else {
        // If another task has locked and is refreshing, wait for it to finish
        await mutex.waitForUnlock();
      }

      // Retry original request after refresh attempt (or after waiting for other refresh)
      result = await queryFn(args, api, extraOptions);

      // If still 401, ensure cleanup
      if ((result as any)?.error?.status === 401) {
        api.dispatch(clearAuth());
        if (typeof window !== "undefined") {
          Cookies.remove(ACCESS_COOKIE, { path: "/" });
          Cookies.remove(REFRESH_COOKIE, { path: "/" });
        }
      }
    }

    return result;
  };

const baseQueryWithReauth = withReauth(baseQueryWithForm);
const companyQueryWithReauth = withReauth(companyQueryWithForm);

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "Company",
    "CompanySettings",
    "Nav",
    "Users",
    "Roles",
    "Inventory",
    "Product",
    "Account",
  ],
  endpoints: (builder) => ({
    // AUTH
    login: builder.mutation<
      { access: string; refresh?: string },
      { username?: string; email?: string; password: string }
    >({
      query: (body) => ({ url: "token/", method: "POST", body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            // normalize possible shapes
            const tokenData = normalizeTokenData(data) || (data as any);
            if (tokenData.access && tokenData.access !== "undefined")
              dispatch(setAccessToken(tokenData.access));
            if (tokenData.refresh && tokenData.refresh !== "undefined")
              dispatch(setRefreshToken(tokenData.refresh));
          }
        } catch (err) {
          // ignore
        }
      },
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
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // ignore error from logout endpoint
        } finally {
          dispatch(clearAuth());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),

    whoami: builder.query<User, void>({
      query: () => "whoami/",
      providesTags: ["Me"],
    }),
    getCompany: builder.query<Company, string>({
      query: (id) => `companies/${id}/`,
      providesTags: ['Company'],
    }),
    getCompanies: builder.query<Company[], void>({
      queryFn: async (arg, api, extraOptions) => {
        const result = await companyQueryWithReauth({ url: 'companies/' }, api, extraOptions);
        if (result.error) return { error: result.error };
        return { data: result.data as Company[], meta: result.meta };
      },
      providesTags: ['Company'],
    }),
     createCompany: builder.mutation<Company, Partial<Company>>({
      queryFn: async (data, api, extraOptions) => {
        const result = await companyQueryWithReauth({ 
          url: 'companies/', 
          method: 'POST', 
          body: data 
        }, api, extraOptions);
        if (result.error) return { error: result.error };
        return { data: result.data as Company, meta: result.meta };
      },
      invalidatesTags: ['Company'],
    }),

    updateCompany: builder.mutation<Company, { id: string; data: Partial<Company> }>({
      queryFn: async ({ id, data }, api, extraOptions) => {
        const result = await companyQueryWithReauth({ 
          url: `companies/${id}/`, 
          method: 'PATCH', 
          body: data 
        }, api, extraOptions);
        if (result.error) return { error: result.error };
        return { data: result.data as Company, meta: result.meta };
      },
      invalidatesTags: ['Company'],
    }),

    deleteCompany: builder.mutation<void, string>({
      queryFn: async (id, api, extraOptions) => {
        const result = await companyQueryWithReauth({ 
          url: `companies/${id}/`, 
          method: 'DELETE' 
        }, api, extraOptions);
        if (result.error) return { error: result.error };
        return { data: undefined };
      },
      invalidatesTags: ['Company'],
    }),
    getCompanySettings: builder.query<CompanySettings, string>({
      queryFn: async (companyId, api, extraOptions, baseQuery) => {
        try {
          const result = await companyQueryWithReauth(
            {
              url: `companies-settings-view/${companyId}/settings/`,
              method: 'GET',
            },
            api,
            extraOptions,
          );
          if (result.error) {
            return { error: result.error };
          }
          return { data: result.data as CompanySettings };
        } catch (error) {
          return {
            error: { status: 'CUSTOM_ERROR', error: 'Failed to fetch company settings' } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['CompanySettings'],
    }),
    updateCompanySettings: builder.mutation<
      CompanySettings,
      { company_id: string; data: FormData | Partial<CompanySettings> }
    >({
      queryFn: async ({ company_id, data }, api, extraOptions, baseQuery) => {
        try {
          const result = await companyQueryWithReauth(
            {
              url: `companies-settings-view/${company_id}/settings/`,
              method: 'PUT',
              body: data,
            },
            api,
            extraOptions,
          );
          if (result.error) {
            return { error: result.error };
          }
          return { data: result.data as CompanySettings };
        } catch (error) {
          return {
            error: { status: 'CUSTOM_ERROR', error: 'Failed to update company settings' } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['CompanySettings'],
    }),
    getCompanyNav: builder.query<NavItem[], string>({
      queryFn: async (companyId, api, extraOptions, baseQuery) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${companyId}/nav/`, method: "GET" },
          api,
          extraOptions,
        );

        if (result.error) {
          return { error: result.error };
        }

        return {
          data: result.data as NavItem[],
        };
      },
      providesTags: ["Nav"],
    }),

    createCompanyNav: builder.mutation<
      NavItem,
      { company_id: string; data: Partial<NavItem> }
    >({
      queryFn: async ({ company_id, data }, api, extraOptions, baseQuery) => {
        const result = await companyQueryWithReauth(
          { url: `companies/${company_id}/nav/`, method: "POST", body: data },
          api,
          extraOptions,
        );

        if (result.error) {
          return { error: result.error };
        }

        return {
          data: result.data as NavItem,
        };
      },
      invalidatesTags: ["Nav"],
    }),
    getUsers: builder.query<User[], void>({
      query: () => "users/",
      providesTags: ["Users"],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `users/${id}/`,
      providesTags: ["Users"],
    }),

    createUser: builder.mutation<User, Partial<User>>({
      query: (data) => ({
        url: "users/",
        method: "POST",
        body: data,
      }),
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
      query: (id) => ({
        url: `users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    getRoles: builder.query<Role[], void>({
      query: () => "roles/",
      providesTags: ["Roles"],
    }),

    getRole: builder.query<Role, string>({
      query: (id) => `roles/${id}/`,
      providesTags: ["Roles"],
    }),

    createRole: builder.mutation<Role, Partial<Role>>({
      query: (data) => ({
        url: "roles/",
        method: "POST",
        body: data,
      }),
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
      query: (id) => ({
        url: `roles/${id}/`,
        method: "DELETE",
      }),
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
  useUpdateCompanyMutation,
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
  useGetCompaniesQuery, 
  useGetCompanyQuery,            
  useCreateCompanyMutation,        
  useDeleteCompanyMutation,       
  useGetCompanyNavQuery,
  useCreateCompanyNavMutation,
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
