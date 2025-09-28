// app/auth/forgot/page.tsx
'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function ForgotPage(){
  const { register, handleSubmit } = useForm<{email:string}>()
  const [loading,setLoading]=useState(false)

  async function onSubmit(data:{email:string}){
    setLoading(true)
    try{
      await api.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/password-reset/`, { email: data.email })
      toast.success('If that email exists you will receive a reset link.')
    }catch(e:any){
      toast.error(e?.response?.data?.detail || 'Request failed')
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toaster />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">Reset your password</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send password reset instructions.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="email" {...register('email', { required: true })} placeholder="you@example.com" className="w-full p-2 border rounded" />
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-primary text-white">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}
