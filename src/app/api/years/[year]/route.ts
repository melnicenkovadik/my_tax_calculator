import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeTransactions(value: unknown) {
  return Array.isArray(value) ? value : [];
}

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
    const { rows } =
      await sql`SELECT year, inputs, defaults, transactions, last_updated FROM years WHERE year = ${yearNum} LIMIT 1`;
    if (!rows.length) {
      return NextResponse.json(null, { status: 200 });
    }
    const row = rows[0];
    return NextResponse.json({
      ...row,
      transactions: normalizeTransactions(row.transactions),
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

    const txs = normalizeTransactions(transactions);

    await sql`
      INSERT INTO years (year, inputs, defaults, transactions, last_updated)
      VALUES (${yearNum}, ${inputs}, ${defaults}, ${txs}, NOW())
      ON CONFLICT (year) DO UPDATE
      SET inputs = EXCLUDED.inputs,
          defaults = EXCLUDED.defaults,
          transactions = EXCLUDED.transactions,
          last_updated = NOW();
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
