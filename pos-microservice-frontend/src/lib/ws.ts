import { io, Socket } from 'socket.io-client'
let socket: Socket | null = null
export function connectWS(token?: string) {
  if (socket) return socket
  socket = io(process.env.NEXT_PUBLIC_WS_URL || '', { auth: { token }, transports: ['websocket'] })
  return socket
}
export function disconnectWS(){ if (socket) { socket.disconnect(); socket = null } }
