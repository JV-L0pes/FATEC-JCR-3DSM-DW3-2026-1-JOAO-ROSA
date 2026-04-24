interface OpenWeatherMain {
  temp: number;
  feels_like: number;
  humidity: number;
}

interface OpenWeatherCondition {
  main: string;
  description: string;
  icon: string;
}

interface OpenWeatherSys {
  country: string;
}

interface OpenWeatherResponse {
  cod: number;
  name: string;
  sys: OpenWeatherSys;
  main: OpenWeatherMain;
  weather: OpenWeatherCondition[];
}

export interface WeatherResult {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  iconUrl: string;
}

export class WeatherServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "WeatherServiceError";
    this.statusCode = statusCode;
  }
}

export const fetchWeatherByCity = async (
  city: string,
  apiKey: string
): Promise<WeatherResult> => {
  const encodedCity = encodeURIComponent(city);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric&lang=pt_br`;

  const response = await fetch(url);
  const payload = (await response.json()) as OpenWeatherResponse & {
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 404) {
      throw new WeatherServiceError("Cidade não encontrada.", 404);
    }

    throw new WeatherServiceError(
      payload.message || "Falha ao consultar API de clima.",
      response.status
    );
  }

  const [weatherInfo] = payload.weather;
  return {
    city: payload.name,
    country: payload.sys.country,
    temperature: payload.main.temp,
    feelsLike: payload.main.feels_like,
    humidity: payload.main.humidity,
    condition: weatherInfo.description,
    iconUrl: `https://openweathermap.org/img/wn/${weatherInfo.icon}@2x.png`
  };
};
