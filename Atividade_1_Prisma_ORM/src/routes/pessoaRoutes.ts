import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  badRequest,
  isPrismaNotFoundError,
  notFound,
  parsePositiveId,
  serverError,
} from "../utils/http";

interface PessoaBody {
  nome?: string;
  email?: string;
}

const router = Router();

function parsePessoaPayload(body: PessoaBody) {
  const nome = String(body.nome ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!nome) {
    return { error: "Nome da pessoa é obrigatório." };
  }

  if (!email) {
    return { error: "E-mail da pessoa é obrigatório." };
  }

  return { nome, email };
}

router.post("/", async (req: Request<{}, {}, PessoaBody>, res: Response) => {
  const payload = parsePessoaPayload(req.body);
  if ("error" in payload) {
    return badRequest(res, payload.error ?? "Dados da pessoa inválidos.");
  }

  try {
    const pessoa = await prisma.pessoa.create({
      data: payload,
    });

    return res.status(201).json(pessoa);
  } catch (error) {
    return serverError(res, error, "Erro ao criar pessoa.");
  }
});

router.get("/", async (_req, res) => {
  try {
    const pessoas = await prisma.pessoa.findMany({
      orderBy: { id: "asc" },
    });

    return res.json(pessoas);
  } catch (error) {
    return serverError(res, error, "Erro ao listar pessoas.");
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID da pessoa inválido.");
  }

  try {
    const pessoa = await prisma.pessoa.findUnique({ where: { id } });

    if (!pessoa) {
      return notFound(res, "Pessoa não encontrada.");
    }

    return res.json(pessoa);
  } catch (error) {
    return serverError(res, error, "Erro ao buscar pessoa.");
  }
});

router.put("/:id", async (req: Request<{ id: string }, {}, PessoaBody>, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID da pessoa inválido.");
  }

  const payload = parsePessoaPayload(req.body);
  if ("error" in payload) {
    return badRequest(res, payload.error ?? "Dados da pessoa inválidos.");
  }

  try {
    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: payload,
    });

    return res.json(pessoa);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound(res, "Pessoa não encontrada.");
    }

    return serverError(res, error, "Erro ao atualizar pessoa.");
  }
});

router.delete("/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return badRequest(res, "ID da pessoa inválido.");
  }

  try {
    await prisma.pessoa.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound(res, "Pessoa não encontrada.");
    }

    return serverError(res, error, "Erro ao excluir pessoa.");
  }
});

export default router;
