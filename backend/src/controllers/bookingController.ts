import { Request, Response } from "express";
import { z } from "zod";
import { listBookingsByDay } from "../repositories/bookingRepository";

const querySchema = z.object({
  date: z.string(),
  professionalId: z.string().optional(),
});

export const getBookingsByDay = async (req: Request, res: Response) => {
  const query = querySchema.parse(req.query);
  const professionalId = query.professionalId ? Number(query.professionalId) : undefined;
  const bookings = await listBookingsByDay(query.date, professionalId);
  res.json(bookings);
};
