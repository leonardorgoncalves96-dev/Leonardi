import { Request, Response } from "express";
import { listMessagesByPhone } from "../repositories/messageRepository";

export const getMessages = async (req: Request, res: Response) => {
  const phone = typeof req.query.phone === "string" ? req.query.phone : undefined;
  const messages = await listMessagesByPhone(phone);
  res.json(messages);
};
