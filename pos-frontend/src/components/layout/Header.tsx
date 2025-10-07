"use client";
import React from "react";
import { useWhoamiQuery, useLogoutMutation } from "@/stores/api";

export default function Header() {
  const { data: me } = useWhoamiQuery(undefined, { skip: false });
  const [logout] = useLogoutMutation();

  const onLogout = async () => {
    try {
      await logout(null).unwrap();
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="w-full border-b bg-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">StockMate POS</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">{me?.email ?? "Guest"}</span>
        <button onClick={onLogout} className="px-3 py-1 rounded bg-slate-100">
          Logout
        </button>
      </div>
    </header>
  );
}
