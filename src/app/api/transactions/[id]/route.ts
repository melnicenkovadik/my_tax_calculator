import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await ensureTables();

    // Get the transaction to find its year
    const { rows } = await sql`
      SELECT year FROM transactions WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const year = rows[0].year;

    // Delete the transaction
    await sql`DELETE FROM transactions WHERE id = ${id}::uuid`;

    // Also remove from JSON field in years table for backward compatibility
    const { rows: yearRows } = await sql`
      SELECT transactions FROM years WHERE year = ${year} LIMIT 1
    `;

    if (yearRows.length) {
      const currentTransactions = Array.isArray(yearRows[0].transactions)
        ? yearRows[0].transactions
        : [];
      const updatedTransactions = currentTransactions.filter(
        (tx: { id?: string }) => tx.id !== id,
      );
      await sql`
        UPDATE years
        SET transactions = ${JSON.stringify(updatedTransactions)}::jsonb
        WHERE year = ${year}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
