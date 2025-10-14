"use client";

import React, { useState } from "react";
import { usePasswordresetMutation } from "@/store/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [passwordreset, { isLoading }] = usePasswordresetMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !email.includes("@")) {
      setLocalError("দয়া করে ভ্যালিড ইমেইল দাও।");
      return;
    }

    try {
      // call the RTK Query mutation and unwrap the result (throws on error)
      await passwordreset({ email }).unwrap();
      setSent(true);
    } catch (err: any) {
      console.error("password reset failed:", err);
      // show a friendly error message; if server returns details, you can parse err.data
      const serverMsg =
        err?.data?.detail ||
        err?.data?.message ||
        (typeof err === "string" ? err : null);
      setLocalError(serverMsg || "Reset link pathabe na — pore try kor.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded shadow"
      >
        <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
          Forgot password
        </h2>

        {sent ? (
          <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
            If that email exists, we've sent a reset link. Check your inbox.
          </div>
        ) : (
          <>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border px-3 py-2 mb-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              aria-label="email"
            />

            {localError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{localError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded text-white ${
                isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
