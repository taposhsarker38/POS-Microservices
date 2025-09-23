'use client'
import { createContext, useEffect, useState, ReactNode } from 'react'
export const ThemeContext = createContext<any>(null)

export default function ThemeProvider({ children, initial }: { children: ReactNode, initial?: any }) {
  const [theme, setTheme] = useState(initial || {})
  useEffect(() => {
    if (theme) {
      const map:any = {
        '--color-primary': theme.primary_color,
        '--color-accent': theme.accent_color,
        '--color-bg': theme.background_color,
        '--color-text': theme.text_color
      }
      Object.entries(map).forEach(([k,v]) => { if (typeof v === 'string') document.documentElement.style.setProperty(k, v) })
    }
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
