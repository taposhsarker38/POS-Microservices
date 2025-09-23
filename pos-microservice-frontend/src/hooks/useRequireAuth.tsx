'use client'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'

export default function useRequireAuth() {
  const token = useSelector((s:any) => s.auth.accessToken)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!token) {
      // preserve requested path in query param `next`
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`)
    }
  }, [token, pathname, router])

  return !!token
}
