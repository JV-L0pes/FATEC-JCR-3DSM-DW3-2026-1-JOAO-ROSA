const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const { pessoaId, carroId } = req.body;
    const associacao = await prisma.pessoaPorCarro.create({
      data: {
        pessoaId: Number(pessoaId),
        carroId: Number(carroId),
      },
    });
    res.status(201).json(associacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao associar pessoa e carro" });
  }
});

router.get("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const associacoes = await prisma.pessoaPorCarro.findMany({
      include: {
        pessoa: true,
        carro: true,
      },
    });
    res.json(associacoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar associações" });
  }
});

router.delete("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    await prisma.pessoaPorCarro.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir associação" });
  }
});

module.exports = router;

