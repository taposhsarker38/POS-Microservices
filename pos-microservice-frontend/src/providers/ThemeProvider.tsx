// providers/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ThemeContextType {
  mode: 'light' | 'dark' | 'auto';
  toggleMode: () => void;
  cssVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  companyId: string;
}

export function ThemeProvider({ children, companyId }: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme-mode') as 'light' | 'dark' | 'auto') || 'auto';
  });

  const cssVariables = useMemo(() => {
    // These would typically come from your backend
    return {
      '--color-primary': '#0ea5a4',
      '--color-secondary': '#64748b',
      '--color-accent': '#f97316',
      '--color-background': '#ffffff',
      '--color-text': '#0f172a',
    };
  }, [companyId]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply theme mode
    const effectiveMode = mode === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode, cssVariables]);

  const toggleMode = () => {
    setMode(current => {
      const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  };

  const value = {
    mode,
    toggleMode,
    cssVariables,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}