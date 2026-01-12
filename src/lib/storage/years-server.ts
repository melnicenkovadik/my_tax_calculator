import { ensureTables, sql } from "@/lib/db";
import type {
  CalculatorInputValues,
  RevenueTransaction,
  YearData,
} from "@/lib/tax/types";

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

const normalizeStoredTransactions = (value: unknown): RevenueTransaction[] => {
  let source: unknown = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as {
        id?: unknown;
        date?: unknown;
        amount?: unknown;
        description?: unknown;
      };
      const date = normalizeDateString(candidate.date);
      const amount = normalizeAmount(candidate.amount);
      if (!date || amount === null) return null;
      const description =
        typeof candidate.description === "string" &&
        candidate.description.trim()
          ? candidate.description.trim()
          : undefined;
      const rawId = typeof candidate.id === "string" ? candidate.id : "";
      const id = rawId || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
            const rand = Math.floor(Math.random() * 16);
            const value = char === "x" ? rand : (rand & 0x3) | 0x8;
            return value.toString(16);
          }));
      return { id, date, amount, description };
    })
    .filter(
      (transaction): transaction is RevenueTransaction => Boolean(transaction),
    );
};

const mergeTransactions = (
  primary: RevenueTransaction[],
  fallback: RevenueTransaction[],
): RevenueTransaction[] => {
  const map = new Map<string, RevenueTransaction>();
  for (const tx of primary) {
    map.set(tx.id, tx);
  }
  for (const tx of fallback) {
    if (!map.has(tx.id)) {
      map.set(tx.id, tx);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export async function fetchYearDataServer(
  year: number,
): Promise<YearData | null> {
  try {
    await ensureTables();
    const { rows } = await sql`
      SELECT year, inputs, defaults, transactions, last_updated
      FROM years
      WHERE year = ${year}
      LIMIT 1
    `;
    if (!rows.length) {
      return null;
    }
    const row = rows[0];
    const { rows: transactionRows } = await sql`
      SELECT id, date, amount, description
      FROM transactions
      WHERE year = ${year}
      ORDER BY date DESC, created_at DESC
    `;
    const transactions = transactionRows
      .map((transaction) => {
        const date = normalizeDateString(transaction.date);
        const amount = normalizeAmount(transaction.amount);
        if (!date || amount === null) return null;
        return {
          id: String(transaction.id),
          date,
          amount,
          description:
            typeof transaction.description === "string" &&
            transaction.description.trim()
              ? transaction.description.trim()
              : undefined,
        };
      })
      .filter(
        (transaction): transaction is RevenueTransaction => Boolean(transaction),
      );
    const storedTransactions = normalizeStoredTransactions(row.transactions);
    return {
      year: row.year,
      inputs: row.inputs as CalculatorInputValues,
      defaults: row.defaults as CalculatorInputValues,
      transactions:
        transactions.length > 0
          ? mergeTransactions(transactions, storedTransactions)
          : storedTransactions,
      lastUpdated: row.last_updated
        ? new Date(row.last_updated).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch year data server", error);
    return null;
  }
}

export async function fetchYearsServer(): Promise<number[]> {
  try {
    await ensureTables();
    const { rows } = await sql`
      SELECT DISTINCT year
      FROM years
      ORDER BY year DESC
    `;
    return rows.map((row) => row.year as number);
  } catch (error) {
    console.error("Failed to fetch years server", error);
    return [];
  }
}
