'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/src/store' // adjust if your store path differs
import { selectAuth, logout as logoutAction } from '@/src/store/slices/authSlice' // adjust path if needed
import { useWebsocket } from '@/src/providers/WebSocketProvider' // adjust path if needed

// --------------------- Nav item type ---------------------
type NavItem = {
  id: string
  title: string
  path?: string
  icon?: string | React.ReactNode
  permission_code?: string
  children?: NavItem[]
}

// ---------- Theme Context (kept from your original file, merged) ----------
const ThemeContext = createContext({
  mode: 'light',
  toggle: () => {},
  accent: 'indigo',
  setAccent: (a: string) => {}
} as any)

export function useTheme() {
  return useContext(ThemeContext)
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const s = localStorage.getItem('theme-mode')
    if (s === 'dark' || s === 'light') return s as 'light'|'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [accent, setAccent] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('theme-accent') || 'indigo') : 'indigo')

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme-mode', mode)
    localStorage.setItem('theme-accent', accent)
  }, [mode, accent])

  const value = useMemo(() => ({ mode, toggle: () => setMode(m => m === 'dark' ? 'light' : 'dark'), accent, setAccent }), [mode, accent])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// --------------------- Small Icon component ---------------------
function Icon({ name }: { name: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-8H3v8z"/></svg>
      )
    case 'orders':
      return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18"/></svg>)
    case 'reports':
      return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/></svg>)
    default:
      return (<span className="w-5 h-5 inline-block" />)
  }
}

// --------------------- Sidebar ---------------------
function Sidebar({ items, collapsed, compact, onClose }: { items: NavItem[]; collapsed: boolean; compact: boolean; onClose?: () => void }) {
  return (
    <nav className={`bg-white dark:bg-slate-900 border-r dark:border-slate-800 h-full flex flex-col ${collapsed ? 'w-20' : 'w-64'} transition-[width] duration-150`}>
      <div className="p-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded p-2">PM</div>
          {!collapsed && <div className="font-semibold">POS Micro</div>}
        </div>
        <div className="ml-auto md:hidden">
          <button onClick={onClose} aria-label="close menu" className="p-1">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-1">
        <ul className={`space-y-1 p-2 ${compact ? 'text-sm' : 'text-sm'}`}>
          {items.map(i => (
            <li key={i.id}>
              <Link href={i.path || '#'} className={`flex items-center gap-3 rounded py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 ${collapsed ? 'justify-center' : ''}`}>
                <Icon name={String(i.icon || '')} />
                {!collapsed && <span>{i.title}</span>}
              </Link>
              {i.children && i.children.length > 0 && !collapsed && (
                <ul className="pl-6 mt-1">
                  {i.children.map(c => (
                    <li key={c.id}>
                      <Link href={c.path || '#'} className="block py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">{c.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 border-t dark:border-slate-800">
        <div className="text-xs text-slate-500">Version 1.0</div>
      </div>
    </nav>
  )
}

// --------------------- Header ---------------------
function Header({ onToggleSidebar, onOpenSettings, onLogout }: { onToggleSidebar: () => void; onOpenSettings: () => void; onLogout: () => void }) {
  const router = useRouter()
  const { mode, toggle } = useTheme()

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" aria-label="toggle menu">☰</button>
        <div className="text-lg font-semibold">Dashboard</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">
          <input className="bg-transparent outline-none text-sm" placeholder="Search..." />
        </div>
        <button aria-label="toggle dark mode" onClick={toggle} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">{mode === 'dark' ? '🌙' : '☀️'}</button>
        <button aria-label="settings" onClick={onOpenSettings} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">⚙️</button>
        <div className="relative">
          <button className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-haspopup="true" aria-expanded="false">
            <img src="/avatar.png" alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            <span className="hidden sm:block">Taposh</span>
          </button>
          <div className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded shadow p-2">
            <Link href="/profile" className="block w-full text-left py-1 px-2 rounded hover:bg-slate-50">Profile</Link>
            <Link href="/settings" className="block w-full text-left py-1 px-2 rounded hover:bg-slate-50">Settings</Link>
            <button className="block w-full text-left py-1 px-2 rounded hover:bg-slate-50 text-red-600" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>
    </header>
  )
}

// --------------------- Settings Drawer ---------------------
function SettingsDrawer({ open, onClose, collapsed, setCollapsed, compact, setCompact }: any) {
  const { accent, setAccent } = useTheme()
  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${open ? '' : 'hidden'}`} aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      <aside className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 border-l dark:border-slate-800 p-4 pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Settings</h3>
          <button onClick={onClose} aria-label="close settings">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-2">Sidebar</div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={collapsed} onChange={() => setCollapsed((c:boolean)=>!c)} /> Compact</label>
            <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={compact} onChange={() => setCompact((c:boolean)=>!c)} /> Small text</label>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-2">Accent color</div>
            <div className="flex gap-2">
              {['indigo','emerald','rose','amber','cyan'].map(a=> (
                <button key={a} onClick={()=>setAccent(a)} className={`p-2 rounded border ${accent===a? 'ring-2 ring-offset-1' : ''}`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// --------------------- StatCard ---------------------
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

// --------------------- Main Layout Export (patched) ---------------------
export default function ProfessionalDashboard({ children }: { children?: React.ReactNode }) {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state: RootState) => selectAuth(state))
  const router = useRouter()

  // local UI state
  const [collapsed, setCollapsed] = useState(false)
  const [compact, setCompact] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifications, setNotifications] = useState<number>(0)

  // websocket (subscribe to events)
  const ws = useWebsocket()
  useEffect(() => {
    if (!ws) return
    const unsub = ws.subscribe('notification.count', (data:any) => {
      if (typeof data?.count === 'number') setNotifications(data.count)
    })
    const unsub2 = ws.subscribe('order.update', (payload:any) => {
      // increase small notification counter
      setNotifications(n => n + 1)
      // optionally: dispatch redux action to update orders list
      // dispatch({ type: 'orders/receiveUpdate', payload })
    })
    return () => {
      unsub()
      unsub2()
    }
  }, [ws, dispatch])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Logout handler
  function handleLogout() {
    // dispatch thunk logout
    dispatch(logoutAction() as any)
    router.replace('/login')
  }

  // Build nav using permission_code
  // Example menu entries have permission_code; adjust codes to match your backend
  const baseNav: NavItem[] = [
    { id: 'dash', title: 'Dashboard', path: '/dashboard', icon: 'dashboard', permission_code: 'dashboard.view' },
    { id: 'orders', title: 'Orders', path: '/orders', icon: 'orders', permission_code: 'orders.view', children: [{ id: 'orders-new', title: 'New Order', path: '/orders/create', permission_code: 'orders.add' }] },
    { id: 'reports', title: 'Reports', path: '/reports', icon: 'reports', permission_code: 'reports.view' },
  ]

  // helper to check permission (if user.permissions missing -> show everything to admin / dev)
  const hasPermission = (code?: string) => {
    if (!code) return true
    if (!user) return false
    if (!user.permissions) return true // if backend doesn't supply permissions, avoid hiding
    return user.permissions.includes(code)
  }

  const nav = baseNav
    .filter(i => hasPermission(i.permission_code))
    .map(i => i.children ? ({ ...i, children: i.children.filter(c => hasPermission(c.permission_code)) }) : i)

  return (
    <ThemeProvider>
      <div className={`min-h-screen flex bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}> 
        {/* Desktop sidebar */}
        <div className={`hidden md:flex flex-shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar items={nav} collapsed={collapsed} compact={compact} />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800">
              <Sidebar items={nav} collapsed={false} compact={compact} onClose={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col">
          <Header onToggleSidebar={() => setMobileOpen(v=>!v)} onOpenSettings={() => setSettingsOpen(true)} onLogout={handleLogout} />

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* content area */}
              {children || (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">Overview</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-500">Notifications: <span className="font-medium">{notifications}</span></div>
                      <button onClick={() => setNotifications(0)} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">Clear</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Sales" value="৳ 210k" />
                    <StatCard title="Orders" value="1,120" />
                    <StatCard title="Customers" value="840" />
                    <StatCard title="Products" value="1,200" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4">Recent orders placeholder</div>
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4">Activity feed placeholder</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} collapsed={collapsed} setCollapsed={setCollapsed} compact={compact} setCompact={setCompact} />
      </div>
    </ThemeProvider>
  )
}
