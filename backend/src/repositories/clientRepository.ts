import { pool } from "../db/pool";

export interface Client {
  id: number;
  name: string | null;
  phone: string;
  notes: string | null;
  created_at: Date;
}

export const findOrCreateClientByPhone = async (
  phone: string,
  name?: string | null
): Promise<Client> => {
  const existing = await pool.query<Client>(
    "SELECT * FROM clients WHERE phone = $1",
    [phone]
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const inserted = await pool.query<Client>(
    "INSERT INTO clients (name, phone) VALUES ($1, $2) RETURNING *",
    [name || null, phone]
  );
  return inserted.rows[0];
};

export const markClientNeedsHuman = async (phone: string) => {
  await pool.query(
    "UPDATE clients SET notes = COALESCE(notes, '') || ' [needs_human]' WHERE phone = $1",
    [phone]
  );
};
