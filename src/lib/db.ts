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

  // Check if transactions table exists and migrate if needed
  const { rows: tableExists } = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'transactions'
    );
  `;

  if (!tableExists[0].exists) {
    // Create new table with TEXT id
    await sql`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        date DATE NOT NULL,
        amount NUMERIC(14, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
  } else {
    // Check if id column is UUID and migrate to TEXT
    const { rows: columnInfo } = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'id';
    `;
    
    if (columnInfo.length > 0 && columnInfo[0].data_type === 'uuid') {
      // Migrate UUID to TEXT
      await sql`
        ALTER TABLE transactions 
        ALTER COLUMN id TYPE TEXT USING id::text;
      `;
    }
  }

  await sql`
    CREATE INDEX IF NOT EXISTS transactions_year_idx ON transactions (year);
  `;
}

export { sql };
