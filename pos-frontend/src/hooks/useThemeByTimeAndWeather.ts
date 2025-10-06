import { useEffect } from "react";

export default function useThemeByTimeAndWeather() {
  useEffect(() => {
    const applyTheme = (theme: string) => {
      try {
        document.documentElement.setAttribute("data-theme", theme);
      } catch (e) {}
    };

    const localThemeByTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "morning";
      if (hour >= 12 && hour < 18) return "evening";
      return "night";
    };

    const weatherApiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!weatherApiKey) {
      applyTheme(localThemeByTime());
      return;
    }

    (async () => {
      try {
        const getPos = () =>
          new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej),
          );
        const pos = await getPos();
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}`,
        );
        const j = await res.json();
        const weatherId = j.weather?.[0]?.id || 800;
        const now = j.dt;
        const sunrise = j.sys?.sunrise;
        const sunset = j.sys?.sunset;
        if (weatherId >= 200 && weatherId < 600) applyTheme("night");
        else if (now && sunrise && sunset && now >= sunrise && now < sunset)
          applyTheme("evening");
        else applyTheme("night");
      } catch (e) {
        applyTheme(localThemeByTime());
      }
    })();
  }, []);
}
