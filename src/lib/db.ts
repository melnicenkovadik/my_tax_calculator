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
        sender TEXT,
        bill_to TEXT,
        notes TEXT,
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

    // Add sender column if missing
    const { rows: senderColumn } = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'sender';
    `;
    if (senderColumn.length === 0) {
      await sql`ALTER TABLE transactions ADD COLUMN sender TEXT`;
    }

    // Add notes column if missing
    const { rows: notesColumn } = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'notes';
    `;
    if (notesColumn.length === 0) {
      await sql`ALTER TABLE transactions ADD COLUMN notes TEXT`;
    }

    // Add bill_to column if missing
    const { rows: billToColumn } = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'bill_to';
    `;
    if (billToColumn.length === 0) {
      await sql`ALTER TABLE transactions ADD COLUMN bill_to TEXT`;
    }
  }

  await sql`
    CREATE INDEX IF NOT EXISTS transactions_year_idx ON transactions (year);
  `;

  // Attachments table
  await sql`
    CREATE TABLE IF NOT EXISTS transaction_attachments (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      content_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS transaction_attachments_tx_idx ON transaction_attachments (transaction_id);
  `;
}

export { sql };
