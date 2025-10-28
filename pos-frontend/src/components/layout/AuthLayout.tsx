"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

type WeatherResponse = {
  weather?: { main: string; description?: string }[];
  main?: { temp?: number; feels_like?: number };
  name?: string;
  sys?: { country?: string };
};

export interface AuthLayoutTheme {
  background: string;
  button: string;
}

export interface AuthLayoutWeatherProps {
  weatherData?: WeatherResponse;
  weatherLoading: boolean;
  weatherError: any;
  mainWeather: string;
  theme: AuthLayoutTheme;
}

const getTimeOfDay = (date = new Date()) => {
  const h = date.getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
};

const chooseTheme = (main: string, timeOfDay: string): AuthLayoutTheme => {
  if (main === "Clear") {
    if (timeOfDay === "night") {
      return {
        background: "linear-gradient(180deg, #0f1724 0%, #262b36 100%)",
        button: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-white/40",
      };
    }
    if (timeOfDay === "morning") {
      return {
        background: "linear-gradient(180deg, #fff7ed 0%, #ffe7a3 100%)",
        button:
          "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-300",
      };
    }
    return {
      background: "linear-gradient(180deg, #a6e3ff 0%, #69b7ff 100%)",
      button: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-300",
    };
  }
  if (main === "Clouds") {
    return {
      background: "linear-gradient(180deg, #e6eef7 0%, #cfd8e6 100%)",
      button: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-slate-300",
    };
  }
  if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
    return {
      background: "linear-gradient(180deg, #3a5a6a 0%, #1f3b4a 100%)",
      button: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-300",
    };
  }
  if (main === "Snow") {
    return {
      background: "linear-gradient(180deg, #f8fcff 0%, #e6f3ff 100%)",
      button: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-300",
    };
  }
  return {
    background: "linear-gradient(180deg, #f0f4f8 0%, #dfe9f3 100%)",
    button:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300",
  };
};

interface AuthLayoutProps {
  children: (props: AuthLayoutWeatherProps) => React.ReactNode;
  showWeatherInfo?: boolean;
}

export default function AuthLayout({
  children,
  showWeatherInfo = true,
}: AuthLayoutProps) {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  useEffect(() => {
    const timer = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mounted) {
            setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          }
        },
        () => {}, 
        { timeout: 6_000 },
      );
    }
    return () => {
      mounted = false;
    };
  }, []);
  const apiUrl = useMemo(() => {
    if (coords) {
      return `/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
    }
    return `/api/weather?q=Dhaka`;
  }, [coords]);
  const {
    data: weatherData,
    error: weatherError,
    isLoading: weatherLoading,
  } = useSWR<WeatherResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const mainWeather = weatherData?.weather?.[0]?.main ?? "Clear";
  const theme = chooseTheme(mainWeather, timeOfDay);
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: theme.background }}
    >
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-6">
        {showWeatherInfo && (
          <div className="mb-4 text-center">
            <div className="inline-block bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
              <p className="text-xs text-slate-600">
                {weatherLoading && "Loading weather..."}
                {weatherError && "Weather unavailable"}
                {weatherData && (
                  <>
                    {mainWeather} • {weatherData.name || "Unknown location"}
                  </>
                )}
              </p>
            </div>
          </div>
        )}
        {children({
          weatherData,
          weatherLoading,
          weatherError,
          mainWeather,
          theme,
        })}
      </div>
    </div>
  );
}
export function useAuthLayoutWeather(): AuthLayoutWeatherProps {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  useEffect(() => {
    const timer = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mounted) {
            setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          }
        },
        () => {},
        { timeout: 6_000 },
      );
    }
    return () => {
      mounted = false;
    };
  }, []);

  const apiUrl = useMemo(() => {
    if (coords) {
      return `/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
    }
    return `/api/weather?q=Dhaka`;
  }, [coords]);

  const {
    data: weatherData,
    error: weatherError,
    isLoading: weatherLoading,
  } = useSWR<WeatherResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const mainWeather = weatherData?.weather?.[0]?.main ?? "Clear";
  const theme = chooseTheme(mainWeather, timeOfDay);
  return { weatherData, weatherLoading, weatherError, mainWeather, theme };
}
