// features/settings/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface CompanySettings {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/company/`,
    credentials: 'include',
  }),
  tagTypes: ['CompanySettings'],
  endpoints: (builder) => ({
    getCompanySettings: builder.query<CompanySettings, string>({
      query: (companyId) => `${companyId}/settings/`,
      providesTags: ['CompanySettings'],
    }),
  }),
});

export const { useGetCompanySettingsQuery } = settingsApi;