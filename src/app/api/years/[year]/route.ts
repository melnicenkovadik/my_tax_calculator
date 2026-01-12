import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return null;
};

const normalizeAmount = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeTransactionsInput = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as {
        id?: unknown;
        date?: unknown;
        amount?: unknown;
        description?: unknown;
      };
      const date = normalizeDateString(candidate.date);
      const amount = normalizeAmount(candidate.amount);
      if (!date || amount === null) return null;
      const description =
        typeof candidate.description === "string" && candidate.description.trim()
          ? candidate.description.trim()
          : undefined;
      const rawId = typeof candidate.id === "string" ? candidate.id : "";
      const id = uuidRegex.test(rawId) ? rawId : generateId();
      return { id, date, amount, description: description ?? undefined };
    })
    .filter(
      (transaction): transaction is {
        id: string;
        date: string;
        amount: number;
        description?: string;
      } => Boolean(transaction),
    );
};

const normalizeStoredTransactions = (value: unknown) => {
  let source: unknown = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as {
        id?: unknown;
        date?: unknown;
        amount?: unknown;
        description?: unknown;
      };
      const date = normalizeDateString(candidate.date);
      const amount = normalizeAmount(candidate.amount);
      if (!date || amount === null) return null;
      const description =
        typeof candidate.description === "string" && candidate.description.trim()
          ? candidate.description.trim()
          : undefined;
      const rawId = typeof candidate.id === "string" ? candidate.id : "";
      const id = rawId || generateId();
      return { id, date, amount, description: description ?? undefined };
    })
    .filter(
      (transaction): transaction is {
        id: string;
        date: string;
        amount: number;
        description?: string;
      } => Boolean(transaction),
    );
};

const mergeTransactions = (
  primary: Array<{ id: string; date: string; amount: number; description?: string }>,
  fallback: Array<{ id: string; date: string; amount: number; description?: string }>,
) => {
  const map = new Map<string, { id: string; date: string; amount: number; description?: string }>();
  for (const tx of primary) {
    map.set(tx.id, tx);
  }
  for (const tx of fallback) {
    if (!map.has(tx.id)) {
      map.set(tx.id, tx);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

async function parseYear(params: Promise<{ year: string }>): Promise<number> {
  const resolved = await params;
  const yearNum = Number(resolved.year);
  if (Number.isNaN(yearNum)) {
    throw new Error("Invalid year");
  }
  return yearNum;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ year: string }> },
) {
  try {
    const yearNum = await parseYear(context.params);
    await ensureTables();
    const { rows } = await sql`
      SELECT year, inputs, defaults, transactions, last_updated
      FROM years
      WHERE year = ${yearNum}
      LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json(null, { status: 200 });
    }
    const row = rows[0];
    const { rows: transactionRows } = await sql`
      SELECT id, date, amount, description
      FROM transactions
      WHERE year = ${yearNum}
      ORDER BY date DESC, created_at DESC
    `;
    const transactions = transactionRows
      .map((transaction) => {
        const date = normalizeDateString(transaction.date);
        const amount = normalizeAmount(transaction.amount);
        if (!date || amount === null) return null;
        return {
          id: String(transaction.id),
          date,
          amount,
          description:
            typeof transaction.description === "string" &&
            transaction.description.trim()
              ? transaction.description.trim()
              : undefined,
        };
      })
      .filter(
        (transaction): transaction is {
          id: string;
          date: string;
          amount: number;
          description?: string;
        } => Boolean(transaction),
      );
    const storedTransactions = normalizeStoredTransactions(row.transactions);
    return NextResponse.json({
      ...row,
      transactions:
        transactions.length > 0
          ? mergeTransactions(transactions, storedTransactions)
          : storedTransactions,
    });
  } catch (error) {
    console.error("GET /api/years/[year] error", error);
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 },
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ year: string }> },
) {
  try {
    const yearNum = await parseYear(context.params);
    await ensureTables();
    const payload = await req.json();
    const {
      inputs = {},
      defaults = {},
      transactions = [],
    } = payload ?? {};

    const txs = normalizeTransactionsInput(transactions);
    const inputsJson = JSON.stringify(inputs ?? {});
    const defaultsJson = JSON.stringify(defaults ?? {});

    await sql`
      INSERT INTO years (year, inputs, defaults, last_updated)
      VALUES (${yearNum}, ${inputsJson}::jsonb, ${defaultsJson}::jsonb, NOW())
      ON CONFLICT (year) DO UPDATE
      SET inputs = EXCLUDED.inputs,
          defaults = EXCLUDED.defaults,
          last_updated = NOW();
    `;

    await sql`DELETE FROM transactions WHERE year = ${yearNum}`;
    for (const transaction of txs) {
      await sql`
        INSERT INTO transactions (id, year, date, amount, description, created_at)
        VALUES (
          ${transaction.id},
          ${yearNum},
          ${transaction.date},
          ${transaction.amount},
          ${transaction.description ?? null},
          NOW()
        );
      `;
    }

    await sql`
      UPDATE years
      SET transactions = ${JSON.stringify(txs)}::jsonb, last_updated = NOW()
      WHERE year = ${yearNum}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/years/[year] error", error);
    return NextResponse.json(
      { error: "Invalid year or payload" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ year: string }> },
) {
  try {
    const yearNum = await parseYear(context.params);
    await ensureTables();
    await sql`DELETE FROM transactions WHERE year = ${yearNum}`;
    await sql`DELETE FROM years WHERE year = ${yearNum}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/years/[year] error", error);
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 },
    );
  }
}
