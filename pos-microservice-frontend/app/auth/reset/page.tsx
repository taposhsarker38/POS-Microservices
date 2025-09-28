// app/auth/reset/page.tsx
'use client'
import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import PasswordInput from '../../../src/components/ui/PasswordInput'
import api from '../../../src/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function ResetPage(){
  const search = useSearchParams()
  const router = useRouter()
  const token = search.get('token') ?? ''
  const uid = search.get('uid') ?? ''
  const { register, handleSubmit } = useForm<{password:string}>()
  const [loading,setLoading]=useState(false)

  async function onSubmit(data:{password:string}){
    if(!token) { toast.error('Missing token'); return }
    setLoading(true)
    try{
      await api.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/password-reset/confirm/`, {
        token, uid, new_password: data.password
      })
      toast.success('Password reset — please log in')
      router.push('/auth/login')
    }catch(e:any){
      toast.error(e?.response?.data?.detail || 'Reset failed')
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toaster />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">Choose a new password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordInput label="New password" {...register('password', { required: true, minLength: 6 })} />
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-primary text-white">
            {loading ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
