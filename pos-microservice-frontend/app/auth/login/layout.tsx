'use client'
import useCompanyTheme from '../../../src/hooks/useCompanyTheme';

export default function ThemeLoader({ children }: { children: React.ReactNode }) {
  const companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || 'default-company-id'
  useCompanyTheme(companyId)

  return <>{children}</>
}
