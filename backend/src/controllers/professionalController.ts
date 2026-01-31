import { Request, Response } from "express";
import { z } from "zod";
import { listProfessionals, updateProfessionalCalendar } from "../repositories/professionalRepository";

const updateSchema = z.object({
  calendar_id: z.string().min(1),
});

export const getProfessionals = async (_req: Request, res: Response) => {
  const professionals = await listProfessionals();
  res.json(professionals);
};

export const updateProfessional = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload = updateSchema.parse(req.body);
  const updated = await updateProfessionalCalendar(id, payload.calendar_id);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json(updated);
};
