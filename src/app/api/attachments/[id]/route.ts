import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await ensureTables();
    const { rows } = await sql`
      SELECT url FROM transaction_attachments WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }
    const url = String(rows[0].url);
    await del(url);
    await sql`DELETE FROM transaction_attachments WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/attachments/[id] error", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 },
    );
  }
}
