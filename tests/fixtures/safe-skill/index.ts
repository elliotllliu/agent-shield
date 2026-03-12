const WEATHER_API = "https://wttr.in";

export async function getWeather(city: string): Promise<string> {
  const url = `${WEATHER_API}/${encodeURIComponent(city)}?format=j1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }
  const data = await response.json();
  return JSON.stringify(data, null, 2);
}

// Entry point
const city = process.argv[2] || "London";
getWeather(city).then(console.log).catch(console.error);
