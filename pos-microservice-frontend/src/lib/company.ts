// // src/lib/company.ts (server)
// export async function fetchCompanySettings(companyId: string) {
//   const base = process.env.NEXT_PUBLIC_COMPANY_URL
//   const res = await fetch(`${base}/api/v1/companies/${companyId}/settings/`, { next: { revalidate: 60 } })
//   if (!res.ok) return null
//   return res.json()
// }

// export function makeCssVars(settings: any = {}) {
//   const vars: string[] = []
//   if (!settings) return ''
//   const map = {
//     '--color-primary': settings.primary_color || '#0ea5a4',
//     '--color-secondary': settings.secondary_color || '#06b6d4',
//     '--color-accent': settings.accent_color || '#f97316',
//     '--color-bg': settings.background_color || '#ffffff',
//     '--color-text': settings.text_color || '#0f172a'
//   }
//   Object.entries(map).forEach(([k,v]) => vars.push(`${k}: ${v}`))
//   return vars.join('; ')
// }

export async function fetchCompanySettings(companyId: string | undefined) {
  const base = process.env.NEXT_PUBLIC_COMPANY_URL
  if (!companyId) return null
  const res = await fetch(`${base}/api/v1/companies/${companyId}/settings/`, { cache: 'force-cache', next: { revalidate: 60 } })
  if (!res.ok) return null
  return res.json()
}

