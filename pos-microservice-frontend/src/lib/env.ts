// lib/env.ts
class Environment {
  private required = [
    'NEXT_PUBLIC_AUTH_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WS_URL'
  ];

  constructor() {
    this.validate();
  }

  private validate() {
    if (typeof window === 'undefined') {
      const missing = this.required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }
    }
  }

  get authUrl() {
    return this.get('NEXT_PUBLIC_AUTH_URL');
  }

  get apiUrl() {
    return this.get('NEXT_PUBLIC_API_URL');
  }

  get wsUrl() {
    return this.get('NEXT_PUBLIC_WS_URL');
  }

  get companyId() {
    return this.get('NEXT_PUBLIC_DEFAULT_COMPANY_ID') || '1';
  }

  get isDevelopment() {
    return this.get('NODE_ENV') === 'development';
  }

  get isProduction() {
    return this.get('NODE_ENV') === 'production';
  }

  private get(key: string): string {
    const value = process.env[key];
    if (!value && this.required.includes(key)) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value || '';
  }
}

export const env = new Environment();