import { pool } from "../db/pool";

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price_cents: number;
  description: string | null;
}

export const listServices = async (): Promise<Service[]> => {
  const result = await pool.query<Service>(
    "SELECT * FROM services ORDER BY id"
  );
  return result.rows;
};

export const createService = async (
  service: Omit<Service, "id">
): Promise<Service> => {
  const result = await pool.query<Service>(
    "INSERT INTO services (name, duration_minutes, price_cents, description) VALUES ($1, $2, $3, $4) RETURNING *",
    [
      service.name,
      service.duration_minutes,
      service.price_cents,
      service.description,
    ]
  );
  return result.rows[0];
};

export const updateService = async (
  id: number,
  service: Partial<Omit<Service, "id">>
): Promise<Service | null> => {
  const result = await pool.query<Service>(
    `UPDATE services
     SET name = COALESCE($1, name),
         duration_minutes = COALESCE($2, duration_minutes),
         price_cents = COALESCE($3, price_cents),
         description = COALESCE($4, description)
     WHERE id = $5
     RETURNING *`,
    [
      service.name || null,
      service.duration_minutes || null,
      service.price_cents || null,
      service.description || null,
      id,
    ]
  );
  return result.rows[0] || null;
};

export const deleteService = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM services WHERE id = $1", [id]);
  return result.rowCount > 0;
};
