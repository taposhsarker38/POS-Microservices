'use client'
import Link from 'next/link'
import { useSelector } from 'react-redux'
export default function Navbar(){
  const user = useSelector((s:any)=>s.auth.user)
  return (
    <header className="bg-white/60 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">POS</Link>
        <nav className="flex gap-4 items-center">
          <Link href="/company">Companies</Link>
          <Link href="/inventory">Inventory</Link>
          {user ? <span className="text-sm">{user.username}</span> : <Link href="/auth/login">Sign in</Link>}
        </nav>
      </div>
    </header>
  )
}
