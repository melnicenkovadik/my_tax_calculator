import { sql } from "@vercel/postgres";

export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS years (
      year INTEGER PRIMARY KEY,
      inputs JSONB NOT NULL,
      defaults JSONB NOT NULL,
      transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export { sql };
