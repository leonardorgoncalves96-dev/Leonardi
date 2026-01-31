export type Intent =
  | "INFO"
  | "AGENDAR"
  | "REMARCAR"
  | "CANCELAR"
  | "HUMANO";

export const classifyIntent = (text: string): Intent => {
  const normalized = text.toLowerCase();
  if (/(cancelar|desmarcar|cancelamento)/.test(normalized)) {
    return "CANCELAR";
  }
  if (/(remarcar|reagendar|trocar horário)/.test(normalized)) {
    return "REMARCAR";
  }
  if (/(agendar|marcar|horário|agenda)/.test(normalized)) {
    return "AGENDAR";
  }
  if (/(preço|valor|serviço|endereço|pagamento|horário de funcionamento)/.test(
    normalized
  )) {
    return "INFO";
  }
  return "HUMANO";
};
