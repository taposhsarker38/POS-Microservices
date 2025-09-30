// features/activity/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  model: string;
  object_id?: string;
  changes?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/activity/`,
    credentials: 'include',
  }),
  tagTypes: ['Activity'],
  endpoints: (builder) => ({
    getActivityLogs: builder.query<ActivityLog[], {
      page?: number;
      page_size?: number;
      user?: string;
      action?: string;
      date_from?: string;
      date_to?: string;
    }>({
      query: (params = {}) => ({
        url: 'logs/',
        params: {
          page: params.page || 1,
          page_size: params.page_size || 50,
          ...params,
        },
      }),
      providesTags: ['Activity'],
    }),
    
    exportActivityLogs: builder.mutation<Blob, {
      format: 'csv' | 'pdf';
      date_from?: string;
      date_to?: string;
    }>({
      query: (params) => ({
        url: 'export/',
        method: 'POST',
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const { useGetActivityLogsQuery, useExportActivityLogsMutation } = activityApi;