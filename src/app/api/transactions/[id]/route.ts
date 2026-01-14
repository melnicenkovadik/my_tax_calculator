import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await ensureTables();
    const payload = await req.json();
    const date = normalizeDateString(payload?.date);
    const amount = normalizeAmount(payload?.amount);
    if (!date || amount === null) {
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
    }
    const description =
      typeof payload?.description === "string" && payload.description.trim()
        ? payload.description.trim()
        : undefined;
    const sender =
      typeof payload?.sender === "string" && payload.sender.trim()
        ? payload.sender.trim()
        : undefined;
    const billTo =
      typeof payload?.billTo === "string" && payload.billTo.trim()
        ? payload.billTo.trim()
        : undefined;
    const notes =
      typeof payload?.notes === "string" && payload.notes.trim()
        ? payload.notes.trim()
        : undefined;

    const { rowCount } = await sql`
      UPDATE transactions
      SET date = ${date},
          amount = ${amount},
          description = ${description ?? null},
          sender = ${sender ?? null},
          bill_to = ${billTo ?? null},
          notes = ${notes ?? null}
      WHERE id = ${id}
    `;

    if (rowCount === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      transaction: { id, date, amount, description, sender, billTo, notes },
    });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

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
