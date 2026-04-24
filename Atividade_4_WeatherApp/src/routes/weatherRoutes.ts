import { Router } from "express";
import {
  fetchWeatherByCity,
  WeatherServiceError
} from "../services/weatherService";

const router = Router();

router.get("/", async (req, res) => {
  const city = String(req.query.city || "").trim();

  if (!city) {
    return res.status(400).json({
      error: "Informe o nome de uma cidade para buscar o clima."
    });
  }

  const apiKey = String(
    process.env.WEATHER_API_KEY || process.env.API_KEY || ""
  ).trim();
  if (!apiKey) {
    return res.status(500).json({
      error: "WEATHER_API_KEY não configurada no arquivo .env."
    });
  }
  if (
    apiKey === "sua_chave_api_weatherapi" ||
    apiKey.toLowerCase().includes("sua_chave") ||
    apiKey.length < 20
  ) {
    return res.status(500).json({
      error:
        "WEATHER_API_KEY inválida no .env. Cadastre uma chave real da WeatherAPI e reinicie o servidor."
    });
  }

  try {
    const weather = await fetchWeatherByCity(city, apiKey);
    return res.json(weather);
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      const typedError = error as { statusCode: number; message?: string };
      return res.status(typedError.statusCode).json({
        error: typedError.message || "Falha ao consultar API de clima."
      });
    }

    return res.status(500).json({
      error: "Erro inesperado ao consultar clima."
    });
  }
});

export default router;
