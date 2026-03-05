const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const { modelo, marca, ano } = req.body;
    const carro = await prisma.carro.create({
      data: { modelo, marca, ano: Number(ano) },
    });
    res.status(201).json(carro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar carro" });
  }
});

router.get("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const carros = await prisma.carro.findMany();
    res.json(carros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar carros" });
  }
});

router.get("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    const carro = await prisma.carro.findUnique({ where: { id } });
    if (!carro) {
      return res.status(404).json({ error: "Carro não encontrado" });
    }
    res.json(carro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar carro" });
  }
});

router.put("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    const { modelo, marca, ano } = req.body;
    const carro = await prisma.carro.update({
      where: { id },
      data: { modelo, marca, ano: Number(ano) },
    });
    res.json(carro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar carro" });
  }
});

router.delete("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    await prisma.carro.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir carro" });
  }
});

module.exports = router;

