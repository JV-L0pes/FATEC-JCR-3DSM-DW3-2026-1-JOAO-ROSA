import { Prisma } from "@prisma/client";
import { Response } from "express";

export function parsePositiveId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ error: message });
}

export function notFound(res: Response, message: string) {
  return res.status(404).json({ error: message });
}

export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export function serverError(
  res: Response,
  error: unknown,
  message: string,
  fallbackStatus = 500,
) {
  console.error(error);
  return res.status(fallbackStatus).json({ error: message });
}
