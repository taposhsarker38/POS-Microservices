"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, X } from 'lucide-react';

interface RequestLog {
  id: string;
  url: string;
  method: string;
  status?: number;
  response?: any;
  error?: string;
  timestamp: Date;
}

export default function FetchInterceptor() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Intercept fetch
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, config] = args;
      const requestId = Math.random().toString(36).substr(2, 9);
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Log request
      const logEntry: RequestLog = {
        id: requestId,
        url: urlString,
        method: config?.method || 'GET',
        timestamp: new Date(),
      };
      
      console.log(`🌐 Fetch Request [${requestId}]:`, {
        url: urlString,
        method: config?.method || 'GET',
        headers: config?.headers,
      });
      
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        
        // Try to get response data
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await clonedResponse.json();
        } else {
          responseData = await clonedResponse.text();
        }
        
        logEntry.status = response.status;
        logEntry.response = responseData;
        
        console.log(`✅ Fetch Response [${requestId}]:`, {
          status: response.status,
          data: responseData,
        });
        
        setLogs(prev => [logEntry, ...prev].slice(0, 20));
        
        return response;
      } catch (error) {
        logEntry.error = String(error);
        
        console.error(`❌ Fetch Error [${requestId}]:`, error);
        
        setLogs(prev => [logEntry, ...prev].slice(0, 20));
        
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 bg-slate-900 text-white p-4 rounded-lg shadow-2xl z-50 max-w-2xl max-h-96 overflow-auto border-2 border-slate-700"
    >
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-green-400" />
          <span className="font-bold">Network Interceptor</span>
          <span className="text-xs text-slate-500">({logs.length} requests)</span>
        </div>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-slate-800 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-500 text-sm">No requests yet...</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded border ${
                log.error
                  ? 'bg-red-900/20 border-red-500'
                  : log.status && log.status >= 200 && log.status < 300
                  ? 'bg-green-900/20 border-green-500'
                  : 'bg-yellow-900/20 border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    log.error
                      ? 'bg-red-500'
                      : log.status && log.status >= 200 && log.status < 300
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}
                >
                  {log.status || 'ERR'}
                </span>
                <span className="text-xs font-mono text-blue-400">{log.method}</span>
                <span className="text-xs text-slate-400 flex-1 truncate">{log.url}</span>
              </div>

              {log.error && (
                <div className="text-xs text-red-400 mt-2">
                  Error: {log.error}
                </div>
              )}

              {log.response && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-white">
                    View Response
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-32">
                    {typeof log.response === 'string'
                      ? log.response
                      : JSON.stringify(log.response, null, 2)}
                  </pre>
                </details>
              )}

              <div className="text-xs text-slate-500 mt-2">
                {log.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setLogs([])}
        className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded w-full"
      >
        Clear Logs
      </button>
    </motion.div>
  );
}