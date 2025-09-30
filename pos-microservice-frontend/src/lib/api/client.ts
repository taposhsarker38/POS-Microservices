// lib/api/client.ts
import { env } from '@/lib/env';

class ApiClient {
  private baseConfig: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  async get(url: string, config?: RequestInit) {
    return this.request(url, { ...config, method: 'GET' });
  }

  async post(url: string, data?: any, config?: RequestInit) {
    return this.request(url, { ...config, method: 'POST', body: JSON.stringify(data) });
  }

  async put(url: string, data?: any, config?: RequestInit) {
    return this.request(url, { ...config, method: 'PUT', body: JSON.stringify(data) });
  }

  async patch(url: string, data?: any, config?: RequestInit) {
    return this.request(url, { ...config, method: 'PATCH', body: JSON.stringify(data) });
  }

  async delete(url: string, config?: RequestInit) {
    return this.request(url, { ...config, method: 'DELETE' });
  }

  private async request(url: string, config: RequestInit) {
    const response = await fetch(`${env.apiUrl}${url}`, {
      ...this.baseConfig,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();