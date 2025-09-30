// src/lib/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.response?.data) {
    return new AppError(
      error.response.data.detail || 'API Error',
      error.response.data.code || 'API_ERROR',
      error.response.status,
      error.response.data
    );
  }

  if (error.request) {
    return new AppError('Network error', 'NETWORK_ERROR', 503);
  }

  return new AppError(
    error.message || 'Unknown error',
    'UNKNOWN_ERROR',
    500
  );
};

// Error boundary component
'use client';

import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}