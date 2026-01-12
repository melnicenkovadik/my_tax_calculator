import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTables();
    const { rows } = await sql`SELECT year FROM years ORDER BY year DESC`;
    return NextResponse.json(rows.map((r) => r.year));
  } catch (error) {
    console.error("GET /api/years error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
