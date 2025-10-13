"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Key, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Cookies from 'js-cookie';
import type { RootState } from '@/store/store';

export default function TokenChecker() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    checkToken();
  }, [accessToken]);

  const checkToken = () => {
    const info: any = {
      redux: accessToken || null,
      cookies_access: Cookies.get('access_token') || Cookies.get('accessToken') || null,
      cookies_refresh: Cookies.get('refresh_token') || Cookies.get('refreshToken') || null,
      allCookies: Cookies.get(),
    };

    // Try to decode JWT
    const tokenToCheck = accessToken || info.cookies_access;
    if (tokenToCheck) {
      try {
        const parts = tokenToCheck.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          info.decoded = payload;
          info.expired = payload.exp ? Date.now() >= payload.exp * 1000 : false;
          info.expiresAt = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null;
        }
      } catch (e) {
        info.decodeError = String(e);
      }
    }

    setTokenInfo(info);
    console.log('🔐 Token Info:', info);
    console.log('🍪 All Cookies:', Cookies.get());
  };

  const hasToken = !!accessToken || !!tokenInfo?.cookies_access;
  const isExpired = tokenInfo?.expired;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-2xl z-50 max-w-md border-2 border-slate-700"
    >
      <div className="flex items-center gap-2 mb-3">
        <Key className="h-5 w-5 text-blue-400" />
        <span className="font-bold text-lg">Authentication Status</span>
        <button
          onClick={checkToken}
          className="ml-auto p-1 hover:bg-slate-800 rounded"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Token Status */}
        <div className={`p-3 rounded-lg border-2 ${hasToken ? (isExpired ? 'bg-orange-900/20 border-orange-500' : 'bg-green-900/20 border-green-500') : 'bg-red-900/20 border-red-500'}`}>
          <div className="flex items-center gap-2 mb-2">
            {hasToken ? (
              isExpired ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <span className="font-bold text-orange-400">Token Expired</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-bold text-green-400">Token Valid</span>
                </>
              )
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="font-bold text-red-400">No Token Found</span>
              </>
            )}
          </div>
          
          {hasToken && (
            <div className="text-xs space-y-1">
              <div className="flex gap-2">
                <span className="text-slate-400">Token:</span>
                <span className="font-mono text-white break-all">
                  {(accessToken || tokenInfo?.cookies_access || '').substring(0, 30)}...
                </span>
              </div>
              {tokenInfo?.expiresAt && (
                <div className="flex gap-2">
                  <span className="text-slate-400">Expires:</span>
                  <span className={isExpired ? 'text-orange-400' : 'text-white'}>
                    {tokenInfo.expiresAt}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storage Check */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">Redux Store:</span>
            <span className={tokenInfo?.redux ? 'text-green-400' : 'text-red-400'}>
              {tokenInfo?.redux ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">Cookies (access):</span>
            <span className={tokenInfo?.cookies_access ? 'text-green-400' : 'text-red-400'}>
              {tokenInfo?.cookies_access ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span className="text-slate-400">Cookies (refresh):</span>
            <span className={tokenInfo?.cookies_refresh ? 'text-green-400' : 'text-red-400'}>
              {tokenInfo?.cookies_refresh ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
        </div>

        {/* All Cookies */}
        {tokenInfo?.allCookies && Object.keys(tokenInfo.allCookies).length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-400 hover:text-white">
              View All Cookies
            </summary>
            <pre className="text-xs mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-32 text-blue-400">
              {JSON.stringify(tokenInfo.allCookies, null, 2)}
            </pre>
          </details>
        )}

        {/* Decoded Token */}
        {tokenInfo?.decoded && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-400 hover:text-white">
              View Decoded Token
            </summary>
            <pre className="text-xs mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-48 text-green-400">
              {JSON.stringify(tokenInfo.decoded, null, 2)}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        {isExpired && (
          <div className="mt-3 p-3 bg-orange-900/30 border border-orange-500 rounded">
            <p className="text-orange-400 text-sm mb-2">⚠️ Token has expired</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium"
            >
              Refresh Token
            </button>
          </div>
        )}

        {!hasToken && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-500 rounded">
            <p className="text-red-400 text-sm mb-2">❌ No authentication token found</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-500">
        <p>🍪 Using Cookies for authentication</p>
      </div>
    </motion.div>
  );
}