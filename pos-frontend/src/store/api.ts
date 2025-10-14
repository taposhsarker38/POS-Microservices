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

const ACCESS_COOKIE = "access_token";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";
const COMPANY_BASE = process.env.NEXT_PUBLIC_COMPANY_URL || "http://localhost:8002";
export const baseUrl = `${BASE}/api/v1/`;
export const companyUrl = `${COMPANY_BASE}/api/v1/`;

const isFormData = (v: unknown): v is FormData => {
  return typeof FormData !== "undefined" && v instanceof FormData;
};

// helper to validate cookie values (ignore "undefined" string)
const validCookie = (v: string | undefined | null) => !!v && v !== "undefined";

const prepareHeaders = (headers: Headers, { getState }: { getState: () => unknown }) => {
  const tokenFromStore = (getState() as RootState).auth?.accessToken || null;
  // backend sometimes sets cookie named "access" (check both)
  const serverCookie = typeof window !== "undefined" ? Cookies.get("access") || null : null;
  const clientCookie = typeof window !== "undefined" ? Cookies.get(ACCESS_COOKIE) || null : null;

  const token =
    tokenFromStore ||
    (validCookie(serverCookie) ? serverCookie : validCookie(clientCookie) ? clientCookie : null);

  if (typeof window !== "undefined") {
    // debug to see what's happening on first reload - remove later
    // eslint-disable-next-line no-console
    console.debug("[prepareHeaders] tokens:", { tokenFromStore: !!tokenFromStore, serverCookie: !!serverCookie, clientCookie: !!clientCookie });
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
  (base: ReturnType<typeof fetchBaseQuery>): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    const modified = typeof args === "string" ? args : ({ ...args } as FetchArgs);
    if (typeof modified !== "string" && isFormData(modified.body)) {
      // override prepareHeaders for this call so Content-Type isn't forced; still attach Authorization
      // @ts-ignore
      modified.prepareHeaders = (headers: Headers) => {
        const tokenFromStore = (api.getState() as RootState).auth?.accessToken || null;
        const serverCookie = typeof window !== "undefined" ? Cookies.get("access") || null : null;
        const clientCookie = typeof window !== "undefined" ? Cookies.get(ACCESS_COOKIE) || null : null;
        const token =
          tokenFromStore ||
          (validCookie(serverCookie) ? serverCookie : validCookie(clientCookie) ? clientCookie : null);

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
              api.dispatch(setRefreshToken(data.refresh));
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
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Company", "CompanySettings", "Nav", "Users", "Roles", "Inventory", "Product", "Account"],
  endpoints: (builder) => ({
    // AUTH
    login: builder.mutation<{ access: string; refresh?: string }, { username?: string; email?: string; password: string }>({
      query: (body) => ({ url: "token/", method: "POST", body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            if (data.access && data.access !== "undefined") dispatch(setAccessToken(data.access));
            if (data.refresh && data.refresh !== "undefined") dispatch(setRefreshToken(data.refresh));
          }
        } catch (err) {
          // ignore
        }
      },
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
    
    whoami: builder.query<User, void>({
      query: () => "whoami/",
      providesTags: ["Me"],
    }),

    // COMPANY ENDPOINTS - Using query instead of queryFn for simpler endpoints
    getCompany: builder.query<Company, string>({
      query: (companyId) => `companies/${companyId}/`,
      providesTags: (result, error, companyId) => [
        { type: "Company", id: companyId }
      ],
    }),
    
    updateCompany: builder.mutation<Company, { id: string; data: Partial<Company> }>({
      query: ({ id, data }) => ({
        url: `companies/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Company", id }
      ],
    }),

    // FIXED: Properly typed queryFn for company settings
    getCompanySettings: builder.query<CompanySettings, string>({
      queryFn: async (companyId, api, extraOptions, baseQuery) => {
        try {
          const result = await companyQueryWithReauth(
            { 
              url: `companies-settings-view/${companyId}/settings/`, 
              method: "GET" 
            },
            api,
            extraOptions,
          );
          
          if (result.error) {
            return { error: result.error };
          }
          
          // Properly type the response
          return { 
            data: result.data as CompanySettings 
          };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: 'Failed to fetch company settings' 
            } as FetchBaseQueryError 
          };
        }
      },
      providesTags: ["CompanySettings"],
    }),

    // FIXED: Properly typed mutation for company settings
    updateCompanySettings: builder.mutation<CompanySettings, { 
      company_id: string; 
      data: FormData | Partial<CompanySettings> 
    }>({
      queryFn: async ({ company_id, data }, api, extraOptions, baseQuery) => {
        try {
          const result = await companyQueryWithReauth(
            { 
              url: `companies-settings-view/${company_id}/settings/`, 
              method: "PUT", 
              body: data 
            },
            api,
            extraOptions,
          );
          
          if (result.error) {
            return { error: result.error };
          }
          
          return { 
            data: result.data as CompanySettings 
          };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: 'Failed to update company settings' 
            } as FetchBaseQueryError 
          };
        }
      },
      invalidatesTags: ["CompanySettings"],
    }),

    // NAV ENDPOINTS - Using queryFn pattern
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
          data: result.data as NavItem[] 
        };
      },
      providesTags: ["Nav"],
    }),

    createCompanyNav: builder.mutation<NavItem, { company_id: string; data: Partial<NavItem> }>({
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
          data: result.data as NavItem 
        };
      },
      invalidatesTags: ["Nav"],
    }),

    // SIMPLE ENDPOINTS using main API (no queryFn needed)
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

    // ROLES
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
  useLogoutMutation,
  useWhoamiQuery,
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
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