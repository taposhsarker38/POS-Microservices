"use client";

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Database, RefreshCw } from 'lucide-react';
import type { RootState } from '@/store/store';
import { useWhoamiQuery } from '@/store/api';

export default function ReduxStoreChecker() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const entireAuthState = useSelector((state: RootState) => state.auth);
  
  // Force the query to run
  const { data, error, isLoading, isFetching, isSuccess, isError } = useWhoamiQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    console.log('🗄️ Redux Store State:', {
      auth: entireAuthState,
      whoamiQuery: {
        data,
        error,
        isLoading,
        isFetching,
        isSuccess,
        isError,
      },
    });
  }, [entireAuthState, data, error, isLoading, isFetching, isSuccess, isError]);

  const forceRefetch = () => {
    console.log('🔄 Forcing whoami refetch...');
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-lg shadow-2xl z-50 max-w-sm border-2 border-slate-700"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-400" />
          <span className="font-bold">Redux Store</span>
        </div>
        <button
          onClick={forceRefetch}
          className="p-1 hover:bg-slate-800 rounded"
          title="Force refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Auth State */}
        <div className="space-y-2">
          <p className="text-slate-400 text-xs uppercase font-bold">Auth State</p>
          
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">isAuthenticated:</span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? '✅ True' : '❌ False'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">accessToken:</span>
            <span className={accessToken ? 'text-green-400' : 'text-red-400'}>
              {accessToken ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
        </div>

        {/* Query State */}
        <div className="space-y-2">
          <p className="text-slate-400 text-xs uppercase font-bold">useWhoamiQuery State</p>
          
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">isLoading:</span>
            <span className={isLoading ? 'text-yellow-400' : 'text-slate-500'}>
              {isLoading ? '⏳ Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">isFetching:</span>
            <span className={isFetching ? 'text-yellow-400' : 'text-slate-500'}>
              {isFetching ? '⏳ Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">isSuccess:</span>
            <span className={isSuccess ? 'text-green-400' : 'text-slate-500'}>
              {isSuccess ? '✅ Yes' : '❌ No'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">isError:</span>
            <span className={isError ? 'text-red-400' : 'text-slate-500'}>
              {isError ? '❌ Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">data:</span>
            <span className={data ? 'text-green-400' : 'text-red-400'}>
              {data ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
        </div>

        {/* User Data */}
        {data && (
          <div className="p-3 bg-green-900/20 border border-green-500 rounded">
            <p className="text-green-400 font-bold mb-2">✅ User Data Loaded!</p>
            <div className="space-y-1 text-xs">
              <div><span className="text-slate-400">Username:</span> {data.username}</div>
              <div><span className="text-slate-400">Email:</span> {data.email}</div>
              <div><span className="text-slate-400">Superuser:</span> {data.is_superuser ? '✅' : '❌'}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500 rounded">
            <p className="text-red-400 font-bold mb-2">❌ Query Error</p>
            <pre className="text-xs overflow-auto max-h-20">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        💡 Check console for detailed logs
      </div>
    </motion.div>
  );
}