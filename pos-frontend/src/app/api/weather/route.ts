// app/api/weather/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const key = process.env.OPENWEATHER_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENWEATHER_KEY not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const q = url.searchParams.get("q") || "Dhaka";

  let target: string;
  if (lat && lon) {
    target = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(key)}&units=metric`;
  } else {
    target = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${encodeURIComponent(key)}&units=metric`;
  }

  // try {
  //   const res = await fetch(target, { next: { revalidate: 60 }, signal: (request as any).signal });
  //   if (!res.ok) {
  //     const text = await res.text();
  //     return NextResponse.json({ error: text }, { status: res.status });
  //   }
  //   const json = await res.json();
  //   // minimal payload
  //   const payload = {
  //     weather: json.weather,
  //     main: json.main,
  //     name: json.name,
  //     sys: json.sys,
  //   };
  //   // cache configured using Next's fetch revalidate + CDNs; also return normally
  //   return NextResponse.json(payload, {
  //     status: 200,
  //     headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  //   });
  // } catch (err) {
  //   console.error("weather proxy error", err);
  //   return NextResponse.json({ error: "weather fetch failed" }, { status: 502 });
  // }
  try {
  const res = await fetch(target, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Upstream failed: ${res.status}`);
  const data = await res.json();
  return NextResponse.json(data);
} catch (err) {
  console.error('Weather fetch failed', err);
  return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
}

}
