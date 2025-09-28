// src/lib/company.ts (server)
export async function fetchCompanyNav(companyId?: string | null) {
  const base = process.env.NEXT_PUBLIC_COMPANY_URL ?? 'http://localhost:8002'
  if (!companyId) return []
  const normalizedBase = base.endsWith('/') ? base.slice(0,-1) : base
  try {
    const res = await fetch(`${normalizedBase}/api/v1/companies/${companyId}/nav/`, { cache: 'force-cache', next: { revalidate: 60 } })
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error('fetchCompanyNav error', e)
    return []
  }
}

export function makeCssVars(settings: any = {}) {
  const vars: string[] = []
  if (!settings) return ''
  const map = {
    '--color-primary': settings.primary_color || '#0ea5a4',
    '--color-secondary': settings.secondary_color || '#06b6d4',
    '--color-accent': settings.accent_color || '#f97316',
    '--color-bg': settings.background_color || '#ffffff',
    '--color-text': settings.text_color || '#0f172a'
  }
  Object.entries(map).forEach(([k,v]) => vars.push(`${k}: ${v}`))
  return vars.join('; ')
}

export async function fetchCompanySettings(companyId: string | undefined) {
  const base = process.env.NEXT_PUBLIC_COMPANY_URL
  if (!companyId) return null
  const res = await fetch(`${base}/api/v1/companies-settings-view/${companyId}/settings/`, { cache: 'force-cache', next: { revalidate: 60 } })
  if (!res.ok) return null
  return res.json()
}

