"use client";

import { formatCurrency } from "@/lib/format/currency";
import { fetchYears, fetchYearData, deleteYearData } from "@/lib/storage/years";
import { parseCalculatorInputs } from "@/lib/tax/validation";
import { computeTotals } from "@/lib/tax/calculations";
import { useState, useEffect } from "react";

type YearsOverviewProps = {
  onYearSelect: (year: number) => void;
  onRefresh: () => void;
};

export function YearsOverview({
  onYearSelect,
  onRefresh,
}: YearsOverviewProps) {
  const [yearRows, setYearRows] = useState<Array<{ year: number; data: any | null }>>(
    [],
  );
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
          const list = await fetchYears();
          const rows = await Promise.all(
            list.map(async (year) => {
              try {
                const data = await fetchYearData(year);
                return { year, data };
              } catch {
                return { year, data: null };
              }
            }),
          );
          if (!cancelled) setYearRows(rows);
      } catch {
        if (!cancelled) setYearRows([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [onRefresh]);

  if (yearRows.length === 0) {
    return null;
  }

  const handleDelete = (year: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Видалити дані за ${year} рік?`)) {
      deleteYearData(year);
      onRefresh();
    }
  };

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Облік
          </p>
          <h2 className="mt-2 font-display text-2xl text-foreground">
            Всі роки
          </h2>
          <p className="mt-2 text-sm text-muted">
            Огляд даних за всі роки. Натисніть на рік, щоб переглянути деталі.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-full border border-card-border p-2 text-muted transition hover:border-foreground/30 hover:text-foreground"
          aria-label={isCollapsed ? "Розгорнути" : "Згорнути"}
        >
          <svg
            className={`h-5 w-5 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <div
        className={`mt-6 grid gap-3 transition-all duration-300 ${
          isCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-[2000px] opacity-100"
        }`}
      >
        {yearRows.map(({ year, data }) => {
          const yearData = data;
          if (!yearData) return null;

          const parsed = parseCalculatorInputs(yearData.inputs);
          if (!parsed.parsed) return null;

          const transactions = yearData.transactions || [];
          const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
          const inputsWithRevenue = { ...parsed.parsed, revenue: totalRevenue || parsed.parsed.revenue };
          const results = computeTotals(inputsWithRevenue);
          const lastUpdated = new Date(yearData.lastUpdated);

          return (
            <div
              key={year}
              onClick={() => onYearSelect(year)}
              className="group cursor-pointer rounded-2xl border border-card-border bg-white/70 p-4 transition hover:border-foreground/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {year}
                    </h3>
                    <span className="text-xs text-muted">
                      {lastUpdated.toLocaleDateString("uk-UA")}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Дохід:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(totalRevenue || parsed.parsed.revenue)}
                      </span>
                      {transactions.length > 0 && (
                        <span className="ml-2 text-xs text-muted">
                          ({transactions.length} транзакцій)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted">Всього до сплати:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(results.totalDue)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(year, e)}
                  className="ml-2 rounded-full p-1 text-xs text-muted opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                  title="Видалити рік"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
