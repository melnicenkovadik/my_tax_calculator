import type {
  CalculatorInputValues,
  RevenueTransaction,
  YearData,
} from "@/lib/tax/types";

const API_BASE = "/api/years";
const STORAGE_PREFIX = "forfettario.year.v1";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const buildYearKey = (year: number) => `${STORAGE_PREFIX}.${year}`;

const readYearFromStorage = (year: number): YearData | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(buildYearKey(year));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const parsedYear = Number((parsed as { year?: unknown }).year);
    if (Number.isNaN(parsedYear)) return null;
    const payload = parsed as {
      year: number;
      inputs: CalculatorInputValues;
      defaults: CalculatorInputValues;
      transactions?: unknown;
      lastUpdated?: string;
      last_updated?: string;
    };
    if (!payload.inputs || !payload.defaults) return null;
    return normalizeYearData({ ...payload, year: parsedYear });
  } catch {
    return null;
  }
};

const writeYearToStorage = (yearData: YearData) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      buildYearKey(yearData.year),
      JSON.stringify(yearData),
    );
  } catch {
    // Ignore localStorage quota errors.
  }
};

const removeYearFromStorage = (year: number) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(buildYearKey(year));
  } catch {
    // Ignore localStorage errors.
  }
};

const listYearsFromStorage = (): number[] => {
  if (!canUseStorage()) return [];
  const years: number[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(`${STORAGE_PREFIX}.`)) continue;
      const suffix = key.slice(STORAGE_PREFIX.length + 1);
      const yearNum = Number(suffix);
      if (!Number.isNaN(yearNum)) years.push(yearNum);
    }
  } catch {
    return [];
  }
  return years.sort((a, b) => b - a);
};

const normalizeTransactions = (value: unknown): RevenueTransaction[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeYearData = (data: {
  year: number;
  inputs: CalculatorInputValues;
  defaults: CalculatorInputValues;
  transactions?: unknown;
  lastUpdated?: string;
  last_updated?: string;
}): YearData => {
  const lastUpdated =
    typeof data.lastUpdated === "string"
      ? data.lastUpdated
      : typeof data.last_updated === "string"
        ? data.last_updated
        : new Date().toISOString();

  return {
    year: data.year,
    inputs: data.inputs,
    defaults: data.defaults,
    transactions: normalizeTransactions(data.transactions),
    lastUpdated,
  };
};

export async function fetchYears(): Promise<number[]> {
  const localYears = listYearsFromStorage();
  try {
    const res = await fetch(API_BASE, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch years");
    const data = await res.json();
    const remoteYears = Array.isArray(data) ? data : [];
    if (remoteYears.length === 0) return localYears;
    return Array.from(new Set([...remoteYears, ...localYears])).sort(
      (a, b) => b - a,
    );
  } catch (error) {
    console.error("Failed to fetch years", error);
    return localYears;
  }
}

export async function fetchYearData(year: number): Promise<YearData | null> {
  try {
    const res = await fetch(`${API_BASE}/${year}`, { cache: "no-store" });
    if (!res.ok) {
      return readYearFromStorage(year);
    }
    const data = await res.json();
    if (!data || typeof data !== "object") {
      return readYearFromStorage(year);
    }
    const normalized = normalizeYearData(data as {
      year: number;
      inputs: CalculatorInputValues;
      defaults: CalculatorInputValues;
      transactions?: unknown;
      lastUpdated?: string;
      last_updated?: string;
    });
    writeYearToStorage(normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to fetch year data", error);
    return readYearFromStorage(year);
  }
}

export async function saveYearData(yearData: YearData): Promise<void> {
  writeYearToStorage(yearData);
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

export async function deleteYearData(year: number): Promise<void> {
  removeYearFromStorage(year);
  try {
    const res = await fetch(`${API_BASE}/${year}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Failed to delete year data", res.status);
    }
  } catch (error) {
    console.error("Failed to delete year data", error);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error("Failed to delete transaction", res.status);
    }
  } catch (error) {
    console.error("Failed to delete transaction", error);
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
    transactions,
    lastUpdated: new Date().toISOString(),
  };
}
