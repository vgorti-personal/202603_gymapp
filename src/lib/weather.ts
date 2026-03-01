import type { WeatherSnapshot } from "@/lib/types";

const WEATHER_CODE_LOOKUP: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy showers",
  95: "Thunderstorm",
};

type GeocodeResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
  daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export async function getWeatherSnapshot(city: string): Promise<WeatherSnapshot | null> {
  const geocodeRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    { cache: "no-store" },
  );

  if (!geocodeRes.ok) {
    return null;
  }

  const geocodeData = (await geocodeRes.json()) as GeocodeResponse;
  const match = geocodeData.results?.[0];
  if (!match) {
    return null;
  }

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
    { cache: "no-store" },
  );

  if (!forecastRes.ok) {
    return null;
  }

  const forecastData = (await forecastRes.json()) as ForecastResponse;
  if (!forecastData.current || !forecastData.daily) {
    return null;
  }

  return {
    city: match.name,
    temperatureC: Math.round(forecastData.current.temperature_2m),
    weatherDescription: WEATHER_CODE_LOOKUP[forecastData.current.weather_code] ?? "Unknown",
    highC: Math.round(forecastData.daily.temperature_2m_max[0] ?? forecastData.current.temperature_2m),
    lowC: Math.round(forecastData.daily.temperature_2m_min[0] ?? forecastData.current.temperature_2m),
  };
}
