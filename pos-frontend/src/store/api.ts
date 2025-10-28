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
      result = await queryFn(args, api, extraOptions);
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
            if (data.access && data.access !== "undefined")
              dispatch(setAccessToken(data.access));
            if (data.refresh && data.refresh !== "undefined")
              dispatch(setRefreshToken(data.refresh));
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
