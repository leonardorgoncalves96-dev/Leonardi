import { pool } from "../db/pool";

export interface MessageRecord {
  id: number;
  phone: string;
  direction: "in" | "out";
  text: string;
  raw_json: Record<string, unknown> | null;
  created_at: Date;
}

export const createMessage = async (
  message: Omit<MessageRecord, "id" | "created_at">
): Promise<MessageRecord> => {
  const result = await pool.query<MessageRecord>(
    `INSERT INTO messages (phone, direction, text, raw_json)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [message.phone, message.direction, message.text, message.raw_json]
  );
  return result.rows[0];
};

export const listMessagesByPhone = async (
  phone?: string
): Promise<MessageRecord[]> => {
  if (phone) {
    const result = await pool.query<MessageRecord>(
      "SELECT * FROM messages WHERE phone = $1 ORDER BY created_at DESC",
      [phone]
    );
    return result.rows;
  }
  const result = await pool.query<MessageRecord>(
    "SELECT * FROM messages ORDER BY created_at DESC LIMIT 200"
  );
  return result.rows;
};
