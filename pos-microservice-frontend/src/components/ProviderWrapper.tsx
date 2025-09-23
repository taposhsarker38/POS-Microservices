'use client'

import React, { ReactNode, useMemo } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import store from '../store' // adjust path if your store is elsewhere
import ThemeProvider from '../context/ThemeProvider'

type Props = {
  children: ReactNode
  settings?: any | null
}

/**
 * ProviderWrapper
 * - Client component that wraps app with Redux and other client-only providers.
 * - Accepts `settings` passed from server layout (optional) so ThemeProvider can apply initial theme.
 */
export default function ProviderWrapper({ children, settings }: Props) {
  // If your store needs preloaded state based on settings, compute here:
  const initial = useMemo(() => ({ settings }), [settings])

  return (
    <ReduxProvider store={store}>
      <ThemeProvider initial={initial.settings}>
        {children}
      </ThemeProvider>
    </ReduxProvider>
  )
}
