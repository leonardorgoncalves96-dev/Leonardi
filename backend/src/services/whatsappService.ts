import axios from "axios";

export const sendWhatsAppMessage = async (to: string, text: string) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const baseUrl = process.env.WHATSAPP_API_BASE_URL;
  if (!accessToken || !phoneNumberId || !baseUrl) {
    throw new Error("WhatsApp configuration missing");
  }

  await axios.post(
    `${baseUrl}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
};
