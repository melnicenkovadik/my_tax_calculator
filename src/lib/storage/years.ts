import type {
  CalculatorInputValues,
  RevenueTransaction,
  TransactionAttachment,
  YearData,
} from "@/lib/tax/types";

const API_BASE = "/api/years";
const TRANSACTIONS_API = "/api/transactions";
const ATTACHMENTS_API = "/api/attachments";

export async function fetchYears(): Promise<number[]> {
  try {
    const res = await fetch(API_BASE, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch years");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch years", error);
    return [];
  }
}

export async function fetchYearData(year: number): Promise<YearData | null> {
  try {
    const res = await fetch(`${API_BASE}/${year}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch year");
    const data = await res.json();
    if (!data || typeof data !== "object") return null;
    return data as YearData;
  } catch (error) {
    console.error("Failed to fetch year data", error);
    return null;
  }
}

export async function deleteYearData(year: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${year}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error("Failed to delete year data", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete year data", error);
    return false;
  }
}

export async function saveYearInputs(
  year: number,
  inputs: CalculatorInputValues,
  defaults: CalculatorInputValues,
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${year}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs, defaults }),
    });
    if (!res.ok) {
      console.error("Failed to save year inputs", res.status);
    }
  } catch (error) {
    console.error("Failed to save year inputs", error);
  }
}

export async function saveYearData(yearData: YearData): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${yearData.year}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(yearData),
    });
    if (!res.ok) {
      console.error("Failed to save year data", res.status);
    }
  } catch (error) {
    console.error("Failed to save year data", error);
  }
}

export async function createTransaction(
  year: number,
  transaction: RevenueTransaction,
): Promise<RevenueTransaction | null> {
  try {
    const res = await fetch(TRANSACTIONS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, ...transaction }),
    });
    if (!res.ok) {
      console.error("Failed to create transaction", res.status);
      return null;
    }
    const data = await res.json();
    return data?.transaction ?? null;
  } catch (error) {
    console.error("Failed to create transaction", error);
    return null;
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${TRANSACTIONS_API}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error("Failed to delete transaction", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete transaction", error);
    return false;
  }
}

export async function updateTransaction(
  id: string,
  transaction: Pick<RevenueTransaction, "date" | "amount"> &
    Partial<
      Pick<RevenueTransaction, "description" | "sender" | "billTo" | "notes" | "causale">
    >,
): Promise<RevenueTransaction | null> {
  try {
    const res = await fetch(`${TRANSACTIONS_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    if (!res.ok) {
      console.error("Failed to update transaction", res.status);
      return null;
    }
    const data = await res.json();
    return data?.transaction ?? null;
  } catch (error) {
    console.error("Failed to update transaction", error);
    return null;
  }
}

export async function uploadAttachment(
  transactionId: string,
  file: File,
): Promise<TransactionAttachment | null> {
  try {
    // Send file directly in body with filename in query params (App Router method)
    const res = await fetch(
      `${TRANSACTIONS_API}/${transactionId}/attachments?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      },
    );
    if (!res.ok) {
      console.error("Failed to upload attachment", res.status);
      return null;
    }
    const data = await res.json();
    return data?.attachment ?? null;
  } catch (error) {
    console.error("Failed to upload attachment", error);
    return null;
  }
}

export async function deleteAttachment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${ATTACHMENTS_API}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Failed to delete attachment", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete attachment", error);
    return false;
  }
}

export function createYearData(
  year: number,
  inputs: CalculatorInputValues,
  defaults: CalculatorInputValues,
  transactions: RevenueTransaction[] = [],
): YearData {
  return {
    year,
    inputs,
    defaults,
    transactions: transactions.map(({ attachments, ...rest }) => rest),
    lastUpdated: new Date().toISOString(),
  };
}
