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

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "API_KEY não configurada no arquivo .env."
    });
  }

  try {
    const weather = await fetchWeatherByCity(city, apiKey);
    return res.json(weather);
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({
      error: "Erro inesperado ao consultar clima."
    });
  }
});

export default router;
