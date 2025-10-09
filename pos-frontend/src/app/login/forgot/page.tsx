"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import clsx from "clsx";
import Link from "next/link";
import { usePasswordresetMutation } from "@/store/api";
import AuthLayout, { type AuthLayoutWeatherProps } from "@/components/layout/AuthLayout";

export default function ForgotPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();
  const [passwordreset, { isLoading: passwordresetLoading }] = usePasswordresetMutation();
  const [done, setDone] = useState(false);

  async function onSubmit(data: { email: string }) {
    toast.dismiss();
    const t = toast.loading("Sending reset link…");
    
    try {
      await passwordreset({ email: data.email }).unwrap();
      toast.success("If that email exists, we've sent a password reset link.");
      setDone(true);
    } catch (err: any) {
      console.error("Password reset error", err);
      const msg = err?.data?.detail || err?.message || "Unable to send reset link. Try again later.";
      toast.error(String(msg));
    } finally {
      toast.dismiss(t);
    }
  }

  return (
    <AuthLayout showWeatherInfo={true}>
      {({ theme }: AuthLayoutWeatherProps) => (
        <>
          <Toaster position="top-right" />
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">Reset your password</h1>
            <p className="text-sm text-slate-600 mb-6">
              Enter your email and we'll send password reset instructions.
            </p>

            {done ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    If that email exists, we have sent a password reset link. Check your inbox (and spam folder).
                  </p>
                </div>
                
                <button
                  onClick={() => setDone(false)}
                  className={clsx(
                    "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                    theme.button
                  )}
                >
                  Send another
                </button>

                <div className="text-center text-sm text-slate-600 mt-4">
                  <Link href="/login" className="text-blue-600 font-medium hover:underline">
                    Back to Sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                    })}
                    placeholder="you@example.com"
                    className={clsx(
                      "w-full px-3 py-2 text-slate-800 rounded-lg border focus:outline-none focus:ring-2",
                      errors.email ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-blue-300"
                    )}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Weather-themed button */}
                <button
                  type="submit"
                  disabled={passwordresetLoading}
                  className={clsx(
                    "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                    theme.button,
                    passwordresetLoading && "opacity-70 cursor-not-allowed"
                  )}
                  aria-busy={passwordresetLoading}
                >
                  {passwordresetLoading ? "Sending…" : "Send reset link"}
                </button>

                <div className="mt-6 text-center text-sm text-slate-600">
                  Remember your password?{" "}
                  <Link href="/login" className="text-blue-600 font-medium hover:underline">
                    Back to Sign in
                  </Link>
                </div>

                {/* Weather info */}
                <p className="text-xs text-slate-500 text-center mt-3">
                  Theme adapts to your local time & weather
                </p>
              </form>
            )}
          </div>
        </>
      )}
    </AuthLayout>
  );
}