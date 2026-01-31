import { Request, Response } from "express";
import { createMessage } from "../repositories/messageRepository";
import { handleIncomingMessage } from "../services/conversationService";
import { sendWhatsAppMessage } from "../services/whatsappService";

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

export const receiveWebhook = async (req: Request, res: Response) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (!message) {
    return res.sendStatus(200);
  }

  const from = message.from;
  const text = message.text?.body || "";

  await createMessage({
    phone: from,
    direction: "in",
    text,
    raw_json: message,
  });

  const reply = await handleIncomingMessage(from, text);

  await sendWhatsAppMessage(from, reply);
  await createMessage({
    phone: from,
    direction: "out",
    text: reply,
    raw_json: null,
  });

  return res.sendStatus(200);
};
