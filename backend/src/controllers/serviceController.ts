import { Request, Response } from "express";
import { z } from "zod";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../repositories/serviceRepository";

const serviceSchema = z.object({
  name: z.string().min(2),
  duration_minutes: z.number().min(15),
  price_cents: z.number().min(0),
  description: z.string().optional().nullable(),
});

export const getServices = async (_req: Request, res: Response) => {
  const services = await listServices();
  res.json(services);
};

export const createServiceHandler = async (req: Request, res: Response) => {
  const payload = serviceSchema.parse(req.body);
  const created = await createService({
    name: payload.name,
    duration_minutes: payload.duration_minutes,
    price_cents: payload.price_cents,
    description: payload.description ?? null,
  });
  res.status(201).json(created);
};

export const updateServiceHandler = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload = serviceSchema.partial().parse(req.body);
  const updated = await updateService(id, payload);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json(updated);
};

export const deleteServiceHandler = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await deleteService(id);
  if (!deleted) {
    return res.status(404).json({ error: "not_found" });
  }
  res.status(204).send();
};
