"use client";
import React from "react";
import { useWhoamiQuery, useLogoutMutation, apiSlice } from "@/store/api";
import { clearAuth } from "@/store/authSlice";
import { useDispatch } from "react-redux";

export default function Header() {
  const { data: me } = useWhoamiQuery(undefined, { skip: false });
  const [logout] = useLogoutMutation();
const dispatch = useDispatch();
  // Header component onLogout
const onLogout = async () => {
  try {
    await logout().unwrap(); // wait for server to respond & Set-Cookie
  } catch (err) {
    console.warn(err);
  } finally {
    dispatch(clearAuth()); // clear client redux state
    dispatch(apiSlice.util.resetApiState());
    window.location.href = '/';
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
