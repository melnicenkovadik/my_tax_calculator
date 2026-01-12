import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export async function GET() {
  await ensureTables();
  const { rows } = await sql`SELECT year FROM years ORDER BY year DESC`;
  return NextResponse.json(rows.map((r) => r.year));
}
