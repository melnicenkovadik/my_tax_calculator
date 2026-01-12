import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  const { year } = await params;
  await ensureTables();
  const yearNum = Number(year);
  if (Number.isNaN(yearNum)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  const { rows } =
    await sql`SELECT year, inputs, defaults, transactions, last_updated FROM years WHERE year = ${yearNum} LIMIT 1`;
  if (!rows.length) {
    return NextResponse.json(null, { status: 200 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  const { year } = await params;
  await ensureTables();
  const yearNum = Number(year);
  if (Number.isNaN(yearNum)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  const payload = await req.json();
  const {
    inputs = {},
    defaults = {},
    transactions = [],
  } = payload ?? {};

  await sql`
    INSERT INTO years (year, inputs, defaults, transactions, last_updated)
    VALUES (${yearNum}, ${inputs}, ${defaults}, ${transactions}, NOW())
    ON CONFLICT (year) DO UPDATE
    SET inputs = EXCLUDED.inputs,
        defaults = EXCLUDED.defaults,
        transactions = EXCLUDED.transactions,
        last_updated = NOW();
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  const { year } = await params;
  await ensureTables();
  const yearNum = Number(year);
  if (Number.isNaN(yearNum)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  await sql`DELETE FROM years WHERE year = ${yearNum}`;
  return NextResponse.json({ ok: true });
}
