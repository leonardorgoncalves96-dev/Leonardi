import { pool } from "../db/pool";

export interface Booking {
  id: number;
  client_id: number;
  professional_id: number;
  service_id: number;
  start_at: Date;
  end_at: Date;
  status: "scheduled" | "canceled" | "rescheduled";
  google_event_id: string | null;
  created_at: Date;
}

export const createBooking = async (
  booking: Omit<Booking, "id" | "created_at">
): Promise<Booking> => {
  const result = await pool.query<Booking>(
    `INSERT INTO bookings
      (client_id, professional_id, service_id, start_at, end_at, status, google_event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      booking.client_id,
      booking.professional_id,
      booking.service_id,
      booking.start_at,
      booking.end_at,
      booking.status,
      booking.google_event_id,
    ]
  );
  return result.rows[0];
};

export const listUpcomingBookingsByPhone = async (
  phone: string
): Promise<Booking[]> => {
  const result = await pool.query<Booking>(
    `SELECT b.*
     FROM bookings b
     JOIN clients c ON c.id = b.client_id
     WHERE c.phone = $1 AND b.status = 'scheduled' AND b.start_at > NOW()
     ORDER BY b.start_at`,
    [phone]
  );
  return result.rows;
};

export const updateBooking = async (
  id: number,
  payload: Partial<Booking>
): Promise<Booking | null> => {
  const result = await pool.query<Booking>(
    `UPDATE bookings
     SET start_at = COALESCE($1, start_at),
         end_at = COALESCE($2, end_at),
         status = COALESCE($3, status),
         google_event_id = COALESCE($4, google_event_id)
     WHERE id = $5
     RETURNING *`,
    [
      payload.start_at || null,
      payload.end_at || null,
      payload.status || null,
      payload.google_event_id || null,
      id,
    ]
  );
  return result.rows[0] || null;
};

export const listBookingsByDay = async (
  date: string,
  professionalId?: number
): Promise<Booking[]> => {
  const params: Array<string | number> = [date];
  let query = `SELECT * FROM bookings
    WHERE start_at::date = $1
    `;
  if (professionalId) {
    params.push(professionalId);
    query += `AND professional_id = $2 `;
  }
  query += "ORDER BY start_at";
  const result = await pool.query<Booking>(query, params);
  return result.rows;
};
