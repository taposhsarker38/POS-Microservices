// app/(auth)/login/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

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
      return { style: { background: "linear-gradient(180deg,#0f1724 0%,#262b36 100%)" }, btn: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-white/40" };
    }
    if (timeOfDay === "morning") {
      return { style: { background: "linear-gradient(180deg,#fff7ed 0%,#ffe7a3 100%)" }, btn: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-300" };
    }
    return { style: { background: "linear-gradient(180deg,#a6e3ff 0%,#69b7ff 100%)" }, btn: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-300" };
  }

  if (main === "Clouds") {
    return { style: { background: "linear-gradient(180deg,#e6eef7 0%,#cfd8e6 100%)" }, btn: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-slate-300" };
  }

  if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
    return { style: { background: "linear-gradient(180deg,#3a5a6a 0%,#1f3b4a 100%)" }, btn: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-300" };
  }

  if (main === "Snow") {
    return { style: { background: "linear-gradient(180deg,#f8fcff 0%,#e6f3ff 100%)" }, btn: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-300" };
  }

  return { style: { background: "linear-gradient(180deg,#f0f4f8 0%,#dfe9f3 100%)" }, btn: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300" };
};

export default function LoginPage() {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [useGeo, setUseGeo] = useState(true);

  const apiUrl = useMemo(() => {
    if (coords) return `/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
    if (!useGeo) return `/api/weather?q=Dhaka`;
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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // এখানে তোমার auth API কল করবে
    // উদাহরণ: fetch('/api/auth/login', { method:'POST', body: JSON.stringify({user,pass}) })
    alert("Login logic not implemented — hook your auth API.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={theme.style}>
      <div className="absolute inset-0 bg-black/8 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Sign in</h1>

          <div className="mb-3 text-xs text-slate-600">
            {isLoading && "Loading weather..."}
            {error && "Weather unavailable — fallback applied"}
            {data && `Weather: ${mainWeather} • ${data?.name || "Unknown"}`}
          </div>

          <form onSubmit={onSubmit} className="space-y-4" aria-label="login form">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input id="username" name="username" required
                className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                type="text" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input id="password" name="password" required
                className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                type="password" />
            </div>

            <div className="pt-1">
              <button type="submit" className={`${theme.btn} w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4`} >
                Sign in
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">Login landing changes by your local time & weather.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
