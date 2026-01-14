import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";
import type { TransactionTemplate } from "@/lib/tax/types";

export const dynamic = "force-dynamic";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  try {
    await ensureTables();
    const { rows } = await sql`
      SELECT 
        id,
        name,
        sender,
        bill_to,
        notes,
        created_at
      FROM transaction_templates
      ORDER BY created_at DESC
    `;

    const templates: TransactionTemplate[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      sender: row.sender ?? undefined,
      billTo: row.bill_to ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at.toISOString(),
    }));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables();
    const payload = await req.json();

    const name =
      typeof payload?.name === "string" ? payload.name.trim() : null;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const sender =
      typeof payload?.sender === "string" ? payload.sender.trim() || null : null;
    const billTo =
      typeof payload?.billTo === "string" ? payload.billTo.trim() || null : null;
    const notes =
      typeof payload?.notes === "string" ? payload.notes.trim() || null : null;

    const id = generateId();

    await sql`
      INSERT INTO transaction_templates (id, name, sender, bill_to, notes)
      VALUES (${id}, ${name}, ${sender}, ${billTo}, ${notes})
    `;

    const { rows } = await sql`
      SELECT 
        id,
        name,
        sender,
        bill_to,
        notes,
        created_at
      FROM transaction_templates
      WHERE id = ${id}
    `;

    const template: TransactionTemplate = {
      id: rows[0].id,
      name: rows[0].name,
      sender: rows[0].sender ?? undefined,
      billTo: rows[0].bill_to ?? undefined,
      notes: rows[0].notes ?? undefined,
      createdAt: rows[0].created_at.toISOString(),
    };

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create template", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
