import { NextResponse } from "next/server";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function POST(req: Request) {
  try {
    await ensureTables();
    const payload = await req.json();
    const yearNum = Number(payload?.year);
    if (Number.isNaN(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

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
    const rawId = typeof payload?.id === "string" ? payload.id : "";
    const id =
      uuidRegex.test(rawId) && rawId
        ? rawId
        : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
              const rand = Math.floor(Math.random() * 16);
              const value = char === "x" ? rand : (rand & 0x3) | 0x8;
              return value.toString(16);
            });

    await sql`
      INSERT INTO transactions (id, year, date, amount, description, sender, bill_to, notes, created_at)
      VALUES (
        ${id},
        ${yearNum},
        ${date},
        ${amount},
        ${description ?? null},
        ${sender ?? null},
        ${billTo ?? null},
        ${notes ?? null},
        NOW()
      );
    `;
    await sql`
      UPDATE years
      SET last_updated = NOW()
      WHERE year = ${yearNum}
    `;

    return NextResponse.json({
      ok: true,
      transaction: {
        id,
        date,
        amount,
        description,
        sender,
        billTo,
        notes,
      },
    });
  } catch (error) {
    console.error("POST /api/transactions error", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
