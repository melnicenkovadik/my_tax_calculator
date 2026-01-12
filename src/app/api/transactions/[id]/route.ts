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

    // First, try to find transaction in transactions table
    const { rows: transactionRows } = await sql`
      SELECT year FROM transactions WHERE id = ${id} LIMIT 1
    `;

    let year: number | null = null;
    let foundInTransactionsTable = false;

    if (transactionRows.length > 0) {
      year = transactionRows[0].year;
      foundInTransactionsTable = true;
      // Delete from transactions table
      await sql`DELETE FROM transactions WHERE id = ${id}`;
    }

    // Also check and update JSON field in years table
    // If not found in transactions table, search all years
    if (!foundInTransactionsTable) {
      const { rows: allYears } = await sql`
        SELECT year, transactions FROM years
      `;

      for (const row of allYears) {
        const currentTransactions = Array.isArray(row.transactions)
          ? row.transactions
          : [];
        const transactionExists = currentTransactions.some(
          (tx: { id?: string }) => tx.id === id,
        );

        if (transactionExists) {
          year = row.year;
          const updatedTransactions = currentTransactions.filter(
            (tx: { id?: string }) => tx.id !== id,
          );
          await sql`
            UPDATE years
            SET transactions = ${JSON.stringify(updatedTransactions)}::jsonb
            WHERE year = ${year}
          `;
          break;
        }
      }
    } else if (year !== null) {
      // Update JSON field even if found in transactions table
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
    }

    if (year === null) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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
