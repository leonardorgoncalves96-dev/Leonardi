import { pool } from "../db/pool";

export interface Professional {
  id: number;
  name: string;
  calendar_id: string;
  created_at: Date;
}

export const listProfessionals = async (): Promise<Professional[]> => {
  const result = await pool.query<Professional>(
    "SELECT * FROM professionals ORDER BY id"
  );
  return result.rows;
};

export const updateProfessionalCalendar = async (
  id: number,
  calendarId: string
): Promise<Professional | null> => {
  const result = await pool.query<Professional>(
    "UPDATE professionals SET calendar_id = $1 WHERE id = $2 RETURNING *",
    [calendarId, id]
  );
  return result.rows[0] || null;
};
