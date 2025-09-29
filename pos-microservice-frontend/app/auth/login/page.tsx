// app/(auth)/login/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../../src/lib/api";
import { useDispatch } from "react-redux";
import { setAccessToken, setUser } from "../../../src/store/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "../../../src/components/ui/PasswordInput";
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
        style: {
          background: "linear-gradient(180deg,#0f1724 0%,#262b36 100%)",
        },
        btn: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-white/40",
      };
    }
    if (timeOfDay === "morning") {
      return {
        style: {
          background: "linear-gradient(180deg,#fff7ed 0%,#ffe7a3 100%)",
        },
        btn: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-300",
      };
    }
    return {
      style: { background: "linear-gradient(180deg,#a6e3ff 0%,#69b7ff 100%)" },
      btn: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-300",
    };
  }

  if (main === "Clouds") {
    return {
      style: { background: "linear-gradient(180deg,#e6eef7 0%,#cfd8e6 100%)" },
      btn: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-slate-300",
    };
  }

  if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
    return {
      style: { background: "linear-gradient(180deg,#3a5a6a 0%,#1f3b4a 100%)" },
      btn: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-300",
    };
  }

  if (main === "Snow") {
    return {
      style: { background: "linear-gradient(180deg,#f8fcff 0%,#e6f3ff 100%)" },
      btn: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-300",
    };
  }

  return {
    style: { background: "linear-gradient(180deg,#f0f4f8 0%,#dfe9f3 100%)" },
    btn: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300",
  };
};

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [useGeo, setUseGeo] = useState(true);

  const apiUrl = useMemo(() => {
    if (coords) return `/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
    return `/api/weather?q=Dhaka`;
  }, [coords, useGeo]);

  const { data, error, isLoading } = useSWR<WeatherResp>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    shouldRetryOnError: false,
    errorRetryCount: 1,
  });

  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          setUseGeo(false);
        },
        { timeout: 6000 }
      );
    } else {
      setUseGeo(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  const mainWeather = data?.weather?.[0]?.main || "Clear";
  const theme = chooseTheme(mainWeather, timeOfDay);
  const dispatch = useDispatch();
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search?.get("next") || "/";

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = useCallback(
    async (formData: LoginInput) => {
      setLoading(true);
      toast.dismiss();
      const t = toast.loading("Signing in...");
      try {
        const res = await api.post(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/token/`,
          {
            username: formData.username,
            password: formData.password,
          },
          { withCredentials: true }
        );

        const access = res?.data?.access;
        if (!access) throw new Error("No access token returned");

        dispatch(setAccessToken(access));
        try {
          const who = await api.get(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/whoami/`
          );
          dispatch(setUser(who.data));
        } catch {
          // best-effort; non-fatal
        }

        toast.success("Signed in");
        // router.push returns void; push to next
        router.push(nextUrl || "/");
      } catch (err: any) {
        console.error("Login error", err);
        const msg =
          err?.response?.data?.detail || err?.message || "Login failed";
        toast.error(msg);
      } finally {
        setLoading(false);
        toast.dismiss(t);
      }
    },
    [dispatch, router, nextUrl]
  );

  useEffect(() => {
    // accessibility: focus first input when mounted
    const el = document.getElementById("username") as HTMLInputElement | null;
    el?.focus();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={theme.style}
    >
      <Toaster position="top-right" />
      <div className="absolute inset-0 bg-black/8 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Sign in</h1>

          <div className="mb-3 text-xs text-slate-600">
            {isLoading && "Loading weather..."}
            {error && "Weather unavailable — fallback applied"}
            {data && `Weather: ${mainWeather} • ${data?.name || "Unknown"}`}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="login form"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                aria-invalid={!!errors.username}
                {...register("username")}
                className={clsx(
                  "w-full px-3 py-2 text-slate-800 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary",
                  errors.username ? "border-red-400" : "border-slate-200"
                )}
                placeholder="Username"
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div>
              <PasswordInput label="Password" {...register("password")} />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  aria-label="Remember me"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link
                href="/auth/forgot"
                className="text-sm text-slate-600 hover:underline"
              >
                Forgot?
              </Link>
            </div>

            <div className="pt-1">
              <button
                disabled={loading}
                type="submit"
                className={clsx(
                  theme.btn,
                  "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                  loading ? "opacity-80 cursor-wait" : "hover:opacity-95",
                  loading && "pointer-events-none"
                )}
                aria-busy={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <a
                href="/auth/register"
                className="text-primary font-medium hover:underline"
              >
                Register
              </a>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Login landing changes by your local time & weather.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
