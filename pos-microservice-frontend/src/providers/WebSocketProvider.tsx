// providers/WebSocketProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAccessToken } from '@/store/slices/slice';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  subscribe: () => () => {},
  emit: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const eventHandlersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const token = useAppSelector(selectAccessToken);

  const connect = useCallback(() => {
    if (!token || socketRef.current) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.warn('WebSocket URL not configured');
        return;
      }

      const socket = new WebSocket(`${wsUrl}?token=${token}`);
      
      socket.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handlers = eventHandlersRef.current.get(data.event) || [];
          handlers.forEach(handler => handler(data.payload));
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // Auto-reconnect after delay
        setTimeout(() => connect(), 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [token]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, []);
    }
    eventHandlersRef.current.get(event)!.push(callback);

    return () => {
      const handlers = eventHandlersRef.current.get(event) || [];
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, payload: data }));
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
    }

    return () => {
      socketRef.current?.close();
    };
  }, [token, connect]);

  const value = {
    socket: socketRef.current,
    isConnected,
    subscribe,
    emit,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}