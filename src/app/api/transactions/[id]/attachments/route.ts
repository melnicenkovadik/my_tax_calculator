import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { ensureTables, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf"];
const ALLOWED_PREFIXES = ["image/"];

const isAllowedType = (type: string) => {
  if (ALLOWED_TYPES.includes(type)) return true;
  return ALLOWED_PREFIXES.some((prefix) => type.startsWith(prefix));
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

async function parseParams(params: Promise<{ id: string }>): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const transactionId = await parseParams(context.params);
    await ensureTables();
    const { rows } = await sql`
      SELECT id, transaction_id, url, content_type, original_name, size, created_at
      FROM transaction_attachments
      WHERE transaction_id = ${transactionId}
      ORDER BY created_at DESC
    `;
    const attachments = rows.map((row) => ({
      id: String(row.id),
      transactionId: String(row.transaction_id),
      url: String(row.url),
      contentType: String(row.content_type),
      originalName: String(row.original_name),
      size: Number(row.size),
      createdAt: new Date(row.created_at).toISOString(),
    }));
    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("GET /api/transactions/[id]/attachments error", error);
    return NextResponse.json(
      { error: "Failed to load attachments" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const transactionId = await parseParams(context.params);
    await ensureTables();

    // Ensure transaction exists
    const { rows: txRows } = await sql`
      SELECT 1 FROM transactions WHERE id = ${transactionId} LIMIT 1
    `;
    if (txRows.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Get filename from query params or use default
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Get content type from headers
    const contentType = req.headers.get("content-type") || "application/octet-stream";
    if (!isAllowedType(contentType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Get content length for size validation
    const contentLength = req.headers.get("content-length");
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Check that request body exists
    if (!req.body) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Upload to Vercel Blob using request.body directly (App Router method)
    const attachmentId = generateId();
    const path = `transactions/${transactionId}/${Date.now()}-${filename}`;
    const blob = await put(path, req.body, {
      access: "public",
      contentType,
    });

    await sql`
      INSERT INTO transaction_attachments (
        id, transaction_id, url, content_type, original_name, size, created_at
      )
      VALUES (
        ${attachmentId},
        ${transactionId},
        ${blob.url},
        ${contentType},
        ${filename},
        ${fileSize},
        NOW()
      );
    `;

    const attachment = {
      id: attachmentId,
      transactionId,
      url: blob.url,
      contentType,
      originalName: filename,
      size: fileSize,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, attachment });
  } catch (error) {
    console.error("POST /api/transactions/[id]/attachments error", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 },
    );
  }
}
