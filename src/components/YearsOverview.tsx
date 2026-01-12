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
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await fetchYears();
        if (!cancelled) setYears(list);
      } catch {
        if (!cancelled) setYears([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [onRefresh]);

  if (years.length === 0) {
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
    <section className="rounded-3xl border border-card-border bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Облік
      </p>
      <h2 className="mt-2 font-display text-2xl text-foreground">
        Всі роки
      </h2>
      <p className="mt-2 text-sm text-muted">
        Огляд даних за всі роки. Натисніть на рік, щоб переглянути деталі.
      </p>

      <div className="mt-6 grid gap-3">
        {years.map((year) => {
          const [yearData, setYearData] = useState<any | null>(null);
          useEffect(() => {
            let cancelled = false;
            fetchYearData(year)
              .then((data) => {
                if (!cancelled) setYearData(data);
              })
              .catch(() => {
                if (!cancelled) setYearData(null);
              });
            return () => {
              cancelled = true;
            };
          }, [year]);
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
