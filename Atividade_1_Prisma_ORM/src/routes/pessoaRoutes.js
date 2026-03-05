const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const { nome, email } = req.body;
    const pessoa = await prisma.pessoa.create({
      data: { nome, email },
    });
    res.status(201).json(pessoa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pessoa" });
  }
});

router.get("/", async (req, res) => {
  const prisma = req.prisma;
  try {
    const pessoas = await prisma.pessoa.findMany();
    res.json(pessoas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar pessoas" });
  }
});

router.get("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    const pessoa = await prisma.pessoa.findUnique({ where: { id } });
    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }
    res.json(pessoa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pessoa" });
  }
});

router.put("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    const { nome, email } = req.body;
    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: { nome, email },
    });
    res.json(pessoa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar pessoa" });
  }
});

router.delete("/:id", async (req, res) => {
  const prisma = req.prisma;
  try {
    const id = Number(req.params.id);
    await prisma.pessoa.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir pessoa" });
  }
});

module.exports = router;

