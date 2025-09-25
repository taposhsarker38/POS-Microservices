// src/hooks/useCompanyTheme.tsx
'use client'
import { useEffect, useState } from 'react'
import { fetchCompanySettings } from '../lib/company'
import { adjustColorForTime } from '../lib/color'

type Slot = 'morning'|'afternoon'|'evening'|'night'
function getTimeSlot(date = new Date()): Slot {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}

const DEFAULTS = {
  '--bg-gradient': 'linear-gradient(135deg,#FFF7ED 0%, #F0F9FF 100%)',
  '--text-primary': '#06283D',
  '--muted': '#475569',
  '--card-bg': 'rgba(255,255,255,0.78)',
  '--btn-bg': '#06B6D4',
  '--btn-bg-hover': '#0891B2',
  '--accent': '#06B6D4'
}

export default function useCompanyTheme(companyId?: string | null) {
  const [applied, setApplied] = useState(false)
  useEffect(()=>{
    let mounted = true
    async function applyTheme(){
      const slot = getTimeSlot()
      // start with defaults
      const vars: Record<string,string> = { ...DEFAULTS }

      // fetch company settings
      try {
        const settings = await fetchCompanySettings(companyId || undefined)
        const theme = settings?.theme
        if (theme) {
          // if company provides hex colors override defaults (but then adjust for time)
          if (theme.primary_color) {
            vars['--btn-bg'] = adjustColorForTime(theme.primary_color, slot)
            vars['--accent'] = adjustColorForTime(theme.primary_color, slot)
          }
          if (theme.accent_color) {
            // small priority: accent_color may override accent
            vars['--btn-bg-hover'] = adjustColorForTime(theme.accent_color, slot)
          }
          if (theme.bg_image) {
            vars['--bg-image'] = `url(${theme.bg_image})`
          }
        }
      } catch (e) {
        // ignore fetch errors; keep defaults
        console.warn('company theme fetch failed', e)
      }

      // finally set CSS variables on :root
      if (!mounted) return
      Object.entries(vars).forEach(([k,v])=>{
        document.documentElement.style.setProperty(k, v)
      })
      setApplied(true)
    }

    applyTheme()
    const interval = setInterval(()=>{ applyTheme() }, 1000 * 60 * 5) // refresh every 5 min
    return ()=> { mounted = false; clearInterval(interval) }
  }, [companyId])

  return applied
}
