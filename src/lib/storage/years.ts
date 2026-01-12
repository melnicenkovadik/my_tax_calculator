import type {
  CalculatorInputValues,
  YearData,
  YearsData,
  RevenueTransaction,
} from "@/lib/tax/types";

const STORAGE_KEY = "forfettario.years.v1";

export function readYearsData(): YearsData {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveYearsData(data: YearsData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function getYearData(year: number): YearData | null {
  const data = readYearsData();
  const yearData = data[String(year)];
  if (!yearData) return null;
  // Migrate old data format
  if (!yearData.transactions) {
    yearData.transactions = [];
  }
  return yearData;
}

export function saveYearData(yearData: YearData): void {
  const data = readYearsData();
  data[String(yearData.year)] = {
    ...yearData,
    lastUpdated: new Date().toISOString(),
  };
  saveYearsData(data);
}

export function getAllYears(): number[] {
  const data = readYearsData();
  return Object.keys(data)
    .map(Number)
    .filter((year) => !isNaN(year))
    .sort((a, b) => b - a);
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

export function deleteYearData(year: number): void {
  const data = readYearsData();
  delete data[String(year)];
  saveYearsData(data);
}
