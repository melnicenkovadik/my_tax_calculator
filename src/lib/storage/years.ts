import type {
  CalculatorInputValues,
  RevenueTransaction,
  YearData,
} from "@/lib/tax/types";

const API_BASE = "/api/years";

export async function fetchYears(): Promise<number[]> {
  const res = await fetch(API_BASE, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch years");
  return await res.json();
}

export async function fetchYearData(year: number): Promise<YearData | null> {
  const res = await fetch(`${API_BASE}/${year}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch year");
  return await res.json();
}

export async function saveYearData(yearData: YearData): Promise<void> {
  await fetch(`${API_BASE}/${yearData.year}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(yearData),
  });
}

export async function deleteYearData(year: number): Promise<void> {
  await fetch(`${API_BASE}/${year}`, { method: "DELETE" });
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
    transactions,
    lastUpdated: new Date().toISOString(),
  };
}
