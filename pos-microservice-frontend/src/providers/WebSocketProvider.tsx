// src/providers/WebSocketProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL) || '' // e.g. wss://example.com/ws/
type Handler = (data:any)=>void

const WebsocketContext = createContext<{ send:(msg:any)=>void, subscribe:(ev:string, h:Handler)=>()=>void }>({
  send: ()=>{},
  subscribe: ()=> ()=>{}
})

export function useWebsocket() { return useContext(WebsocketContext) }

export default function WebSocketProvider({ children } : { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket|null>(null)
  const handlers = useRef<Record<string, Handler[]>>({})
  const [connected, setConnected] = useState(false)
  const retry = useRef(0)
  const maxRetry = 10

  useEffect(() => {
    let mounted = true
    function connect() {
      if (!WS_URL) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws
      ws.onopen = () => { retry.current = 0; setConnected(true) }
      ws.onclose = () => { setConnected(false); if (!mounted && retry.current >= maxRetry) return; const delay = Math.min(30000, 1000 * 2 ** retry.current); retry.current += 1; setTimeout(connect, delay) }
      ws.onerror = () => { /* errors will close */ }
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          const { type, data } = payload
          ;(handlers.current[type]||[]).forEach(h=>h(data))
        } catch (e) {
          // ignore non-json
        }
      }
    }

    connect()
    return () => { mounted = false; wsRef.current?.close() }
  }, [])

  function send(msg:any) {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg))
      }
    } catch (e) {}
  }

  function subscribe(ev:string, handler: Handler) {
    handlers.current[ev] = [...(handlers.current[ev]||[]), handler]
    return () => { handlers.current[ev] = (handlers.current[ev]||[]).filter(h=>h!==handler) }
  }

  return (
    <WebsocketContext.Provider value={{ send, subscribe }}>
      {children}
    </WebsocketContext.Provider>
  )
}
