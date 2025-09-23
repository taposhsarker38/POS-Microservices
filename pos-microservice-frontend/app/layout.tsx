import './globals.css'
import { ReactNode } from 'react'
import ThemeProvider from '@/context/ThemeProvider' // context for theme colors
import { fetchCompanySettings } from '../src/lib/company'
import ProviderWrapper from '../src/components/ProviderWrapper' // redux provider wrapper (client)

export default async function RootLayout({ children }: { children: ReactNode }) {
  // determine company id: you can parse host/subdomain or read cookie/param
  const companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || 'default-company-id'
  const settings = await fetchCompanySettings(companyId)
  const cssVars = settings ? `
    --color-primary: ${settings.primary_color || '#0ea5a4'};
    --color-accent: ${settings.accent_color || '#f97316'};
    --color-bg: ${settings.background_color || '#ffffff'};
    --color-text: ${settings.text_color || '#0f172a'};
  ` : ''
  return (
    <html lang="en">
      <head>
        
        <style dangerouslySetInnerHTML={{ __html: `:root{${cssVars}}` }} />
      </head>
      <body className="bg-app">
        {/* ProviderWrapper is a client component wrapping Redux Provider */}
        <ProviderWrapper settings={settings}>
          <ThemeProvider initial={settings}>
            {children}
          </ThemeProvider>
        </ProviderWrapper>
      </body>
    </html>
  )
}
