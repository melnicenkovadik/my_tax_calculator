"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchYears, deleteYearData } from "@/lib/storage/years";

type YearsDropdownProps = {
  currentYear: number;
  onYearSelect: (year: number) => void;
  onRefresh?: () => void;
  refreshKey?: number;
};

export function YearsDropdown({
  currentYear,
  onYearSelect,
  onRefresh,
  refreshKey,
}: YearsDropdownProps) {
  const [years, setYears] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadYears = async () => {
      setIsLoading(true);
      try {
        const list = await fetchYears();
        setYears(list);
      } catch {
        setYears([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadYears();
  }, [currentYear, refreshKey]);

  const handleDelete = async (year: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Видалити дані за ${year} рік?`)) {
      await deleteYearData(year);
      const updatedYears = years.filter((y) => y !== year);
      setYears(updatedYears);
      if (onRefresh) {
        onRefresh();
      }
      if (year === currentYear && updatedYears.length > 0) {
        onYearSelect(updatedYears[0]);
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
      >
        Рік {years.length > 0 && `(${years.length})`}
      </button>

      {isOpen && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <div
                className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-card-border bg-card/95 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="sticky top-0 flex items-center justify-between border-b border-card-border bg-card/95 px-6 py-4 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Рік
                    </p>
                    <h2 className="mt-1 font-display text-2xl text-foreground">
                      Ваші роки
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-muted transition hover:bg-white/20 hover:text-foreground"
                    aria-label="Закрити"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="py-8 text-center text-sm text-muted">
                      Завантаження...
                    </div>
                  ) : years.length === 0 ? (
                    <div className="rounded-xl border border-card-border bg-white/60 p-6 text-center text-sm text-muted">
                      Немає даних
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {years.map((year) => (
                        <div
                          key={year}
                          className={`flex items-center justify-between rounded-xl border border-card-border bg-white/80 px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-accent-wash/30 ${
                            year === currentYear ? "ring-1 ring-accent/40" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onYearSelect(year);
                              setIsOpen(false);
                            }}
                            className={`flex-1 text-left font-semibold ${
                              year === currentYear ? "text-foreground" : "text-muted"
                            }`}
                          >
                            {year} {year === currentYear && "•"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(year, e)}
                            className="ml-3 rounded-lg border border-card-border bg-white/70 px-2 py-1 text-xs text-muted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                            title="Видалити рік"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
