// src/features/auth/hooks.ts
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
export function useRequireAuth() {
  const token = useSelector((s:any) => s.auth.accessToken)
  const router = useRouter()
  if (!token) {
    router.push('/auth/login')
  }
  return token
}
