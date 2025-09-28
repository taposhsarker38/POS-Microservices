// src/components/ui/PasswordInput.tsx
'use client'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
export default function PasswordInput({ label = 'Password', ...props }: Props) {
  const [show, setShow] = useState(false)
  return (
    <label className="block w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="relative">
        <input type={show ? 'text' : 'password'} {...props} className="w-full px-3 py-2 text-slate-800 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary" placeholder='Password'/>
        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(s => !s)} className="absolute right-2 top-2 p-1 text-slate-500">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}
