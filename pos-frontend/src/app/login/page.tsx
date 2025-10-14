"use client";

import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { setAccessToken, setTokens } from "@/store/authSlice";
import { apiSlice, useLoginMutation, useWhoamiQuery } from "@/store/api";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthLayout, { type AuthLayoutWeatherProps } from "@/components/layout/AuthLayout";
import type { RootState } from "@/store/store";

const SpinnerCentered: React.FC<{ message?: string }> = ({ message = "Loading…" }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="text-sm text-slate-600">{message}</div>
    </div>
  </div>
);

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search?.get("next") || "/dashboard";
  const dispatch = useDispatch();
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  
  const { data: whoamiUser, isLoading: whoamiIsLoading } = useWhoamiQuery(undefined, { 
    skip: Boolean(accessToken) 
  });
  
  const isAuthenticated = Boolean(accessToken || whoamiUser);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isAuthenticated, router, nextUrl]);

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ 
    resolver: zodResolver(LoginSchema), 
    defaultValues: { username: "", password: "" } 
  });

  const onSubmit = useCallback(async (formData: LoginInput) => {
    toast.dismiss();
    const loadingToast = toast.loading("Signing in...");
    
    try {
      const res = await login({ 
        username: formData.username, 
        password: formData.password 
      }).unwrap();
      
      const access = (res as any)?.access;
      if (!access) throw new Error("No access token returned");
      
      dispatch(setAccessToken(access));
      
      // Fetch user data
      try {
        const whoRes = await (dispatch as any)(apiSlice.endpoints.whoami.initiate(undefined));
        if (whoRes?.data) dispatch(setTokens(whoRes.data));
      } catch (e) {
        console.warn("whoami failed after login", e);
      }
      
      toast.success("Signed in successfully");
      router.push(nextUrl);
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || "Login failed";
      toast.error(String(msg));
    } finally {
      toast.dismiss(loadingToast);
    }
  }, [dispatch, login, router, nextUrl]);

  // Auto-focus username field
  useEffect(() => {
    document.getElementById("username")?.focus();
  }, []);

  if (isAuthenticated) {
    return <SpinnerCentered message="Redirecting…" />;
  }

  if (whoamiIsLoading) {
    return <SpinnerCentered message="Checking session…" />;
  }

  return (
    <AuthLayout showWeatherInfo={true}>
      {({ theme }: AuthLayoutWeatherProps) => (
        <>
          <Toaster position="top-right" />
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Sign in</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <input 
                  id="username" 
                  type="text" 
                  {...register("username")}
                  aria-invalid={!!errors.username}
                  className={clsx(
                    "w-full px-3 py-2 text-slate-800 rounded-lg border focus:outline-none focus:ring-2",
                    errors.username ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-blue-300"
                  )}
                  placeholder="Enter your username" 
                  autoComplete="username" 
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div>
              <PasswordInput label="Password" {...register("password")} />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

              <div className="flex items-center justify-between">
                <label className="text-sm flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4" aria-label="Remember me" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <Link href="/login/forgot" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Weather-themed button */}
              <button
                disabled={loginLoading}
                type="submit"
                className={clsx(
                  "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                  theme.button,
                  loginLoading && "opacity-70 cursor-not-allowed"
                )}
                aria-busy={loginLoading}
              >
                {loginLoading ? "Signing in..." : "Sign in"}
              </button>

              <div className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
                  Register
                </Link>
              </div>
              <p className="text-xs text-slate-500 text-center mt-3">
                Theme adapts to your local time & weather
              </p>
            </form>
          </div>
        </>
      )}
    </AuthLayout>
  );
}