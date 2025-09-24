
'use client'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../../../src/lib/api'
import { useDispatch } from 'react-redux'
import { setAccessToken, setUser } from '../../../src/store/authSlice'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import clsx from 'clsx'

/** validation schema */
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginInput = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const search = useSearchParams()
  const nextUrl = search?.get('next') || '/'

  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' }
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    toast.dismiss()
    const t = toast.loading('Signing in...')
    try {
      // call auth token endpoint — expects access + cookie-refresh
      const res = await api.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/token/`, {
        username: data.username,
        password: data.password
      }, { withCredentials: true })

      const access = res.data.access
      if (!access) throw new Error('No access token returned')

      dispatch(setAccessToken(access))

      // optionally fetch whoami to populate user state
      try {
        const who = await api.get(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/whoami/`)
        dispatch(setUser(who.data))
      } catch (e) {
        // best-effort; not fatal
      }

      toast.success('Signed in')
      router.push(nextUrl || '/')
    } catch (err: any) {
      console.error('Login error', err)
      const msg = err?.response?.data?.detail || err?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
      toast.dismiss(t)
    }
  }

  useEffect(() => {
    // accessibility: focus first input when mounted
    const el = document.getElementById('username')
    el?.focus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">P</div>
          <div>
            <h1 className="text-2xl font-semibold">Sign in to POS</h1>
            <p className="text-sm text-slate-500">Enter your credentials to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              id="username"
              type="text"
              aria-invalid={!!errors.username}
              {...register('username')}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary',
                errors.username ? 'border-red-400' : 'border-slate-200'
              )}
              placeholder="username"
              autoComplete="username"
            />
            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              aria-invalid={!!errors.password}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary',
                errors.password ? 'border-red-400' : 'border-slate-200'
              )}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>
            <Link href="/auth/forgot" className="text-sm text-primary hover:underline">Forgot?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'w-full py-2 rounded-lg font-semibold text-white transition',
              loading ? 'bg-primary/70 cursor-wait' : 'bg-primary hover:opacity-95'
            )}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link href="/auth/register" className="text-primary font-medium hover:underline">Register</Link>
        </div>
      </div>
    </div>
  )
}

