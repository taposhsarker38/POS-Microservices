"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { setAccessToken, setUser } from "@/stores/authSlice";
import { apiSlice, useLoginMutation, useWhoamiQuery } from "@/stores/api";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";
import type { RootState } from "@/stores/store";

/* ----------------------- small helpers ----------------------- */
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

/* ----------------------- weather/theme (kept from your original) ----------------------- */
type WeatherResp = {
  weather?: { main: string; description?: string }[];
  main?: { temp?: number; feels_like?: number };
  name?: string;
  sys?: { country?: string };
};
const getTimeOfDay = (date = new Date()) => {
  const h = date.getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
};
const chooseTheme = (main: string, timeOfDay: string) => {
  if (main === "Clear") {
    if (timeOfDay === "night") {
      return {
        style: { background: "linear-gradient(180deg,#0f1724 0%,#262b36 100%)" },
        btn: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-white/40",
      };
    }
    if (timeOfDay === "morning") {
      return {
        style: { background: "linear-gradient(180deg,#fff7ed 0%,#ffe7a3 100%)" },
        btn: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-300",
      };
    }
    return { style: { background: "linear-gradient(180deg,#a6e3ff 0%,#69b7ff 100%)" }, btn: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-300" };
  }
  if (main === "Clouds") return { style: { background: "linear-gradient(180deg,#e6eef7 0%,#cfd8e6 100%)" }, btn: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-slate-300" };
  if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) return { style: { background: "linear-gradient(180deg,#3a5a6a 0%,#1f3b4a 100%)" }, btn: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-300" };
  if (main === "Snow") return { style: { background: "linear-gradient(180deg,#f8fcff 0%,#e6f3ff 100%)" }, btn: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-300" };
  return { style: { background: "linear-gradient(180deg,#f0f4f8 0%,#dfe9f3 100%)" }, btn: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300" };
};

/* ----------------------- form schema ----------------------- */
const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginInput = z.infer<typeof LoginSchema>;

/* ----------------------- component ----------------------- */
export default function LoginPage() {
  // theme + weather (unchanged behavior)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let mounted = true;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (!mounted) return; setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
        () => {},
        { timeout: 6_000 },
      );
    }
    return () => { mounted = false; };
  }, []);
  const apiUrl = useMemo(() => (coords ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}` : `/api/weather?q=Dhaka`), [coords]);
  const { data: weatherData, error: weatherError, isLoading: weatherLoading } = useSWR<WeatherResp>(apiUrl, fetcher, { revalidateOnFocus: false, dedupingInterval: 60_000 });
  const mainWeather = weatherData?.weather?.[0]?.main ?? "Clear";
  const theme = chooseTheme(mainWeather, timeOfDay);

  // router / query
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = (search?.get("next") as string) || "/dashboard";

  // redux + api
  const dispatch = useDispatch();
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  // Run whoami only if we DON'T have a redux token (cookie-only session)
  const { data: whoamiUser, isLoading: whoamiIsLoading, isError: whoamiIsError } = useWhoamiQuery(undefined, { skip: Boolean(accessToken) });

  // local redirecting state to prevent flash while we run router.replace
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already authenticated (redux token OR cookie whoami), redirect client-side immediately.
  const isAuthenticatedClient = Boolean(accessToken || whoamiUser);
  useEffect(() => {
    if (isAuthenticatedClient) {
      // set redirecting flag so UI shows spinner (no flash)
      setIsRedirecting(true);
      // use replace so back button doesn't return to login
      router.replace(nextUrl ?? "/dashboard");
    }
  }, [isAuthenticatedClient, router, nextUrl]);

  // Form + login mutation
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), defaultValues: { username: "", password: "" } });

  // submit handler (useCallback for perf)
  const onSubmit = useCallback(async (formData: LoginInput) => {
    toast.dismiss();
    const t = toast.loading("Signing in...");
    try {
      const res = await login({ username: formData.username, password: formData.password }).unwrap();
      const access = (res as any)?.access;
      if (!access) throw new Error("No access token returned");

      // store token in redux for API header usage
      dispatch(setAccessToken(access));

      // try to fetch user (populate redux user)
      try {
        const whoRes = await (dispatch as any)(apiSlice.endpoints.whoami.initiate(undefined));
        if (whoRes && "data" in whoRes && whoRes.data) dispatch(setUser(whoRes.data));
      } catch (e) {
        // non-fatal
        console.warn("whoami failed after login", e);
      }

      toast.success("Signed in");
      // navigate (we expect cookie was set by server; middleware will accept)
      router.push(nextUrl ?? "/dashboard");
    } catch (err: any) {
      console.error("Login error", err);
      const msg = err?.data?.detail || err?.response?.data?.detail || err?.message || "Login failed";
      toast.error(String(msg));
    } finally {
      toast.dismiss(t);
    }
  }, [dispatch, login, router, nextUrl]);

  // focus on username input for accessibility
  useEffect(() => {
    const el = document.getElementById("username") as HTMLInputElement | null;
    el?.focus();
  }, []);

  // ------------- block rendering to avoid flash -------------
  // If we decided to redirect (isRedirecting true) -> show spinner
  if (isRedirecting) return <SpinnerCentered message="Redirecting…" />;

  // If no redux token and we are validating cookie session (whoami) -> show spinner (avoid flash)
  if (!accessToken && whoamiIsLoading) {
    return <SpinnerCentered message="Checking session…" />;
  }

  // (At this point: not authenticated OR we have accessToken but user not redirected yet) -> render form
  return (
    <div className="min-h-screen flex items-center justify-center" style={theme.style}>
      <Toaster position="top-right" />
      <div className="absolute inset-0 bg-black/8 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Sign in</h1>

          <div className="mb-3 text-xs text-slate-600">
            {weatherLoading && "Loading weather..."}
            {weatherError && "Weather unavailable — fallback applied"}
            {weatherData && `Weather: ${mainWeather} • ${weatherData?.name || "Unknown"}`}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="login form" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input id="username" type="text" {...register("username")}
                aria-invalid={!!errors.username}
                className={clsx("w-full px-3 py-2 text-slate-800 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary",
                  errors.username ? "border-red-400" : "border-slate-200")}
                placeholder="Username" autoComplete="username" />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
            </div>

            <div>
              <PasswordInput label="Password" {...register("password")} />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" aria-label="Remember me" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link href="/auth/forgot" className="text-sm text-slate-600 hover:underline">Forgot?</Link>
            </div>

            <div className="pt-1">
              <button
                disabled={loginLoading}
                type="submit"
                className={clsx(theme.btn, "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                  loginLoading ? "opacity-80 cursor-wait pointer-events-none" : "hover:opacity-95")}
                aria-busy={loginLoading}
              >
                {loginLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">Register</Link>
            </div>

            <p className="text-xs text-slate-600 mt-3">Login landing changes by your local time & weather.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
