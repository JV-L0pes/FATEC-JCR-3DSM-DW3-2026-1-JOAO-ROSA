import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  badRequest,
  isPrismaNotFoundError,
  notFound,
  parsePositiveId,
  serverError,
} from "../utils/http";

interface AssociacaoBody {
  pessoaId?: number | string;
  carroId?: number | string;
}

const router = Router();

function parseAssociacaoPayload(body: AssociacaoBody) {
  const pessoaId = Number(body.pessoaId);
  const carroId = Number(body.carroId);

  if (!Number.isInteger(pessoaId) || pessoaId <= 0) {
    return { error: "Pessoa inválida para associação." };
  }

  if (!Number.isInteger(carroId) || carroId <= 0) {
    return { error: "Carro inválido para associação." };
  }

  return { pessoaId, carroId };
}

router.post("/", async (req: Request<{}, {}, AssociacaoBody>, res: Response) => {
  const payload = parseAssociacaoPayload(req.body);
  if ("error" in payload) {
    return badRequest(res, payload.error ?? "Dados da associação inválidos.");
  }

  try {
    const associacao = await prisma.pessoaPorCarro.create({
      data: payload,
      include: {
        pessoa: true,
        carro: true,
      },
    });

    return res.status(201).json(associacao);
  } catch (error) {
    return serverError(res, error, "Erro ao associar pessoa e carro.");
  }
});

router.get("/", async (_req, res) => {
  try {
    const associacoes = await prisma.pessoaPorCarro.findMany({
      include: {
        pessoa: true,
        carro: true,
      },
      orderBy: [{ pessoaId: "asc" }, { carroId: "asc" }],
    });

    return res.json(associacoes);
  } catch (error) {
    return serverError(res, error, "Erro ao listar associações.");
  }
});

router.delete("/:pessoaId/:carroId", async (req, res) => {
  const pessoaId = parsePositiveId(req.params.pessoaId);
  const carroId = parsePositiveId(req.params.carroId);

  if (!pessoaId || !carroId) {
    return badRequest(res, "Chaves da associação são inválidas.");
  }

  try {
    await prisma.pessoaPorCarro.delete({
      where: {
        pessoaId_carroId: {
          pessoaId,
          carroId,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound(res, "Associação não encontrada.");
    }

    return serverError(res, error, "Erro ao excluir associação.");
  }
});

export default router;
