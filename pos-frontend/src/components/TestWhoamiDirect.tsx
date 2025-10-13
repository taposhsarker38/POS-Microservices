"use client";

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';
import Cookies from 'js-cookie';
import type { RootState } from '@/store/store';

export default function TestWhoamiDirect() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const testDirectFetch = async () => {
    setLoading(true);
    setResult(null);

    try {
      const token = accessToken || Cookies.get('access_token');
      const url = 'http://localhost:8001/api/v1/whoami/';

      console.log('🧪 Direct Test - URL:', url);
      console.log('🧪 Direct Test - Token:', token ? 'Present' : 'Missing');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      console.log('🧪 Direct Test - Response:', data);

      setResult({
        success: response.ok,
        status: response.status,
        data: data,
      });
    } catch (error) {
      console.error('🧪 Direct Test - Error:', error);
      setResult({
        success: false,
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDirectFetch();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white p-6 rounded-xl shadow-2xl z-50 max-w-lg border-2 border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-xl">Direct Whoami Test</span>
        </div>
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="p-2 hover:bg-slate-800 rounded disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Testing direct fetch...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border-2 ${
              result.success
                ? 'bg-green-900/20 border-green-500'
                : 'bg-red-900/20 border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">
                {result.success ? '✅ Success' : '❌ Failed'}
              </span>
              {result.status && (
                <span className="text-sm text-slate-400">
                  Status: {result.status}
                </span>
              )}
            </div>

            {result.data && result.data.id && (
              <div className="space-y-2 text-sm mt-3">
                <div className="flex gap-2">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-white font-mono">{result.data.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">Username:</span>
                  <span className="text-white">{result.data.username}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white">{result.data.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">Superuser:</span>
                  <span className={result.data.is_superuser ? 'text-amber-400' : 'text-slate-400'}>
                    {result.data.is_superuser ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <details>
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white">
              View Full Response
            </summary>
            <pre className="text-xs mt-2 p-3 bg-slate-800 rounded overflow-auto max-h-48">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>

          {result.success && result.data?.id && (
            <div className="p-4 bg-green-900/30 border border-green-500 rounded">
              <p className="text-green-400 font-bold mb-2">
                ✅ Direct fetch works!
              </p>
              <p className="text-sm text-green-300">
                This means the backend is working correctly. The issue is with RTK Query configuration.
              </p>
            </div>
          )}

          {!result.success && (
            <div className="p-4 bg-red-900/30 border border-red-500 rounded">
              <p className="text-red-400 font-bold mb-2">
                ❌ Direct fetch failed
              </p>
              <p className="text-sm text-red-300">
                {result.error || 'Check if backend is running and token is valid'}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}