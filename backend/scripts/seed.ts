import { pool } from "../src/db/pool";
import salonInfo from "../src/config/salonInfo.json";

const seed = async () => {
  await pool.query("BEGIN");
  try {
    const professionals = [
      { name: "Profissional A", calendar_id: "calendar_a" },
      { name: "Profissional B", calendar_id: "calendar_b" },
      { name: "Profissional C", calendar_id: "calendar_c" },
    ];

    for (const pro of professionals) {
      await pool.query(
        `INSERT INTO professionals (name, calendar_id)
         SELECT $1, $2
         WHERE NOT EXISTS (SELECT 1 FROM professionals WHERE name = $1)`,
        [pro.name, pro.calendar_id]
      );
    }

    for (const service of salonInfo.services) {
      await pool.query(
        `INSERT INTO services (name, duration_minutes, price_cents, description)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = $1)`,
        [service.name, service.duration_minutes, service.price_cents, service.description]
      );
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
