import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  badRequest,
  isPrismaNotFoundError,
  notFound,
  parsePositiveId,
  serverError,
} from "../utils/http";

interface CarroBody {
  modelo?: string;
  marca?: string;
  ano?: number | string;
}

const router = Router();

function parseCarroPayload(body: CarroBody) {
  const modelo = String(body.modelo ?? "").trim();
  const marca = String(body.marca ?? "").trim();
  const ano = Number(body.ano);

  if (!modelo) {
    return { error: "Modelo do carro é obrigatório." };
  }

  if (!marca) {
    return { error: "Marca do carro é obrigatória." };
  }

  if (!Number.isInteger(ano) || ano <= 0) {
    return { error: "Ano do carro é inválido." };
  }

  return { modelo, marca, ano };
}

router.post("/", async (req: Request<{}, {}, CarroBody>, res: Response) => {
  const payload = parseCarroPayload(req.body);
  if ("error" in payload) {
    return badRequest(res, payload.error ?? "Dados do carro inválidos.");
  }

  try {
    const carro = await prisma.carro.create({
      data: payload,
    });

    return res.status(201).json(carro);
  } catch (error) {
    return serverError(res, error, "Erro ao criar carro.");
  }
});

router.get("/", async (_req, res) => {
  try {
    const carros = await prisma.carro.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    });

    return res.json(carros);
  } catch (error) {
    return serverError(res, error, "Erro ao listar carros.");
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID do carro inválido.");
  }

  try {
    const carro = await prisma.carro.findUnique({ where: { id } });

    if (!carro) {
      return notFound(res, "Carro não encontrado.");
    }

    return res.json(carro);
  } catch (error) {
    return serverError(res, error, "Erro ao buscar carro.");
  }
});

router.put("/:id", async (req: Request<{ id: string }, {}, CarroBody>, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID do carro inválido.");
  }

  const payload = parseCarroPayload(req.body);
  if ("error" in payload) {
    return badRequest(res, payload.error ?? "Dados do carro inválidos.");
  }

  try {
    const carro = await prisma.carro.update({
      where: { id },
      data: payload,
    });

    return res.json(carro);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound(res, "Carro não encontrado.");
    }

    return serverError(res, error, "Erro ao atualizar carro.");
  }
});

router.delete("/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID do carro inválido.");
  }

  try {
    await prisma.carro.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound(res, "Carro não encontrado.");
    }

    return serverError(res, error, "Erro ao excluir carro.");
  }
});

export default router;
