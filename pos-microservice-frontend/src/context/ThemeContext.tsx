'use client'
import { createContext, useState, useEffect, ReactNode } from 'react'

export const ThemeContext = createContext({ theme: {}, setOverride: (o:any)=>{} })

export default function ThemeProvider({ children, initial }: { children:ReactNode, initial?:any }) {
  const [theme, setTheme] = useState(initial || {})
  useEffect(()=> {
    // apply client-side css vars (if layout didn't)
    if (theme) {
      Object.entries({
        '--color-primary': theme.primary_color,
        '--color-accent': theme.accent_color
      }).forEach(([k,v]) => {
        if (v) document.documentElement.style.setProperty(k, v)
      })
    }
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setOverride: setTheme }}>{children}</ThemeContext.Provider>
}
