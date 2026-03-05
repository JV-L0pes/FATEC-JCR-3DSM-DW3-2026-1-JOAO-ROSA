const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const carroRoutes = require("./routes/carroRoutes");
const pessoaRoutes = require("./routes/pessoaRoutes");
const associacaoRoutes = require("./routes/associacaoRoutes");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

app.use("/api/carros", carroRoutes);
app.use("/api/pessoas", pessoaRoutes);
app.use("/api/associacoes", associacaoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

