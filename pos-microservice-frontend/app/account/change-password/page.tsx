// app/account/change-password/page.tsx
'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../../../src/lib/api'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import PasswordInput from '../../../src/components/ui/PasswordInput'

export default function ChangePassword() {
  const { register, handleSubmit } = useForm<{old_password:string; new_password:string}>()
  const [loading,setLoading]=useState(false)

  async function onSubmit(data:any){
    setLoading(true)
    try{
      await api.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/auth/change-password/`, {
        old_password: data.old_password, new_password: data.new_password
      })
      toast.success('Password changed')
    }catch(e:any){
      toast.error(e?.response?.data?.detail || 'Change failed')
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-6">
      <Toaster />
      <div className="max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordInput label="Current password" {...register('old_password', { required:true })} />
          <PasswordInput label="New password" {...register('new_password', { required:true, minLength:6 })} />
          <button className="py-2 px-4 bg-primary text-white rounded" type="submit">Change password</button>
        </form>
      </div>
    </div>
  )
}
