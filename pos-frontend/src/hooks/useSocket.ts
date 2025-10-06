"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { store } from "../stores/store";
import { apiSlice } from "../lib/apiSlice";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8001";
    const socket = io(base, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => console.log("socket connected", socket.id));
    socket.on("inventory.updated", (payload: any) => {
      // invalidate inventory cache
      store.dispatch(apiSlice.util.invalidateTags(["Inventory"]));
    });
    socket.on("order.created", () => {
      store.dispatch(apiSlice.util.invalidateTags(["Company", "Inventory"]));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  return socketRef;
}
