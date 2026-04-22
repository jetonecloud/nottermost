import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const workspacesRouter = Router();
workspacesRouter.use(requireAuth);

workspacesRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json(
    workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt.toISOString(),
    })),
  );
});

const createSchema = z.object({ name: z.string().min(1).max(80) });
workspacesRouter.post("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const ws = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      members: { create: { userId, role: "owner" } },
    },
  });

  return res.status(201).json({
    id: ws.id,
    name: ws.name,
    createdAt: ws.createdAt.toISOString(),
  });
});

