import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";
import type { TransactionTemplate } from "@/lib/tax/types";

export const dynamic = "force-dynamic";

async function parseParams(params: Promise<{ id: string }>): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTables();
    const id = await parseParams(context.params);

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

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

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const template: TransactionTemplate = {
      id: rows[0].id,
      name: rows[0].name,
      sender: rows[0].sender ?? undefined,
      billTo: rows[0].bill_to ?? undefined,
      notes: rows[0].notes ?? undefined,
      createdAt: rows[0].created_at.toISOString(),
    };

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch template", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTables();
    const id = await parseParams(context.params);
    const payload = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

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

    const { rowCount } = await sql`
      UPDATE transaction_templates
      SET 
        name = ${name},
        sender = ${sender},
        bill_to = ${billTo},
        notes = ${notes}
      WHERE id = ${id}
    `;

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update template", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTables();
    const id = await parseParams(context.params);

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const { rowCount } = await sql`
      DELETE FROM transaction_templates
      WHERE id = ${id}
    `;

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
