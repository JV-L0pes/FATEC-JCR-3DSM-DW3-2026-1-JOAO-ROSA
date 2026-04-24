interface WeatherApiLocation {
  name: string;
  country: string;
}

interface WeatherApiCurrentCondition {
  text: string;
  icon: string;
}

interface WeatherApiCurrent {
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  condition: WeatherApiCurrentCondition;
}

interface WeatherApiSuccessResponse {
  location: WeatherApiLocation;
  current: WeatherApiCurrent;
}

interface WeatherApiErrorResponse {
  error: {
    code: number;
    message: string;
  };
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
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const fetchWeatherByCity = async (
  city: string,
  apiKey: string
): Promise<WeatherResult> => {
  const encodedCity = encodeURIComponent(city);
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodedCity}&lang=pt`;

  const response = await fetch(url);
  const payload = (await response.json()) as
    | WeatherApiSuccessResponse
    | WeatherApiErrorResponse;

  if (!response.ok) {
    const errorPayload = payload as WeatherApiErrorResponse;
    const errorMessage = errorPayload.error?.message;
    const normalizedMessage = String(errorMessage || "").toLowerCase();

    if (response.status === 404 || normalizedMessage.includes("no matching location")) {
      throw new WeatherServiceError("Cidade não encontrada.", 404);
    }

    if (response.status === 401 || normalizedMessage.includes("api key")) {
      throw new WeatherServiceError(
        "Chave da WeatherAPI inválida. Verifique WEATHER_API_KEY no .env.",
        401
      );
    }

    throw new WeatherServiceError(
      errorMessage || "Falha ao consultar API de clima.",
      response.status
    );
  }

  const weatherData = payload as WeatherApiSuccessResponse;
  const weatherInfo = weatherData.current.condition;
  const iconUrl = weatherInfo.icon.startsWith("//")
    ? `https:${weatherInfo.icon}`
    : weatherInfo.icon;

  return {
    city: weatherData.location.name,
    country: weatherData.location.country,
    temperature: weatherData.current.temp_c,
    feelsLike: weatherData.current.feelslike_c,
    humidity: weatherData.current.humidity,
    condition: weatherInfo.text,
    iconUrl
  };
};
