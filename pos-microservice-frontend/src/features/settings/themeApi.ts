// src/features/settings/themeApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CompanySettings {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  logo_url?: string;
  favicon_url?: string;
  created_at: string;
  updated_at: string;
}

export const themeApi = createApi({
  reducerPath: 'themeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/`,
    credentials: 'include',
  }),
  tagTypes: ['CompanySettings'],
  endpoints: (builder) => ({
    getCompanySettings: builder.query<CompanySettings, string>({
      query: (companyId) => `companies/${companyId}/settings/`,
      providesTags: ['CompanySettings'],
    }),
    updateCompanySettings: builder.mutation<
      CompanySettings,
      { companyId: string; settings: Partial<CompanySettings> }
    >({
      query: ({ companyId, settings }) => ({
        url: `companies/${companyId}/settings/`,
        method: 'PATCH',
        body: settings,
      }),
      invalidatesTags: ['CompanySettings'],
    }),
  }),
});

export const { useGetCompanySettingsQuery, useUpdateCompanySettingsMutation } = themeApi;