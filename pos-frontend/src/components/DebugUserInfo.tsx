"use client";

import React from 'react';
import { useWhoamiQuery } from '@/store/api';
import { motion } from 'framer-motion';
import { User, Shield, AlertCircle } from 'lucide-react';

/**
 * Debug component to check user data
 * Use this temporarily to see what data is coming from the API
 */
export default function DebugUserInfo() {
  const { data: me, isLoading, error } = useWhoamiQuery();

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
        Loading user data...
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-bold">Error Loading User</span>
        </div>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify(error, null, 2)}
        </pre>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-2xl z-50 max-w-md border-2 border-slate-700"
    >
      <div className="flex items-center gap-2 mb-3">
        <User className="h-5 w-5 text-indigo-400" />
        <span className="font-bold text-lg">User Debug Info</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">Email:</strong>
          <span className="text-white">{me?.email || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">Username:</strong>
          <span className="text-white">{me?.username || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">First Name:</strong>
          <span className="text-white">{me?.first_name || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">Last Name:</strong>
          <span className="text-white">{me?.last_name || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">Company ID:</strong>
          <span className="text-white">{me?.company_id || 'N/A'}</span>
        </div>
        
        <div className={`flex items-center gap-2 p-2 rounded ${me?.is_superuser ? 'bg-amber-900/30 border border-amber-500' : 'bg-slate-800'}`}>
          <Shield className={`h-4 w-4 ${me?.is_superuser ? 'text-amber-400' : 'text-slate-500'}`} />
          <strong className="text-slate-400">Is Superuser:</strong>
          <span className={`font-bold ${me?.is_superuser ? 'text-amber-400' : 'text-red-400'}`}>
            {me?.is_superuser ? '✅ YES' : '❌ NO'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
          <strong className="text-slate-400">Is Active:</strong>
          <span className={me?.is_active ? 'text-green-400' : 'text-red-400'}>
            {me?.is_active ? '✅ Active' : '❌ Inactive'}
          </span>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-white">
          View Raw JSON
        </summary>
        <pre className="text-xs mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-48 text-green-400">
          {JSON.stringify(me, null, 2)}
        </pre>
      </details>

      <p className="text-xs text-slate-500 mt-3 italic">
        💡 Remove this component after debugging
      </p>
    </motion.div>
  );
}