import dotenv from "dotenv";
import express from "express";
import path from "path";
import weatherRoutes from "./routes/weatherRoutes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/weather", weatherRoutes);
app.use(express.static(path.join(__dirname, "../views")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor WeatherApp rodando em http://localhost:${port}`);
});
