import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { prisma } from "./lib/prisma";
import associacaoRoutes from "./routes/associacaoRoutes";
import carroRoutes from "./routes/carroRoutes";
import pessoaRoutes from "./routes/pessoaRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "../public");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL não encontrado. Configure o arquivo .env em Atividade_1_Prisma_ORM antes de iniciar o servidor.",
  );
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use("/api/carros", carroRoutes);
app.use("/api/pessoas", pessoaRoutes);
app.use("/api/associacoes", associacaoRoutes);

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close();
}

process.on("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});
