"use client";

import { useState, useEffect } from "react";
import type { CalculatorInputValues } from "@/lib/tax/types";
import { fetchYears } from "@/lib/storage/years";

type YearSelectorProps = {
  currentYear: number;
  currentInputs: CalculatorInputValues;
  currentDefaults: CalculatorInputValues;
  onYearChange: (year: number, opts?: { forceCreate?: boolean }) => void;
};

export function YearSelector({
  currentYear,
  currentInputs,
  currentDefaults,
  onYearChange,
}: YearSelectorProps) {
  const [years, setYears] = useState<number[]>([]);
  const [showNewYearInput, setShowNewYearInput] = useState(false);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetchYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, [currentYear]);

  const handleAddYear = () => {
    const yearNum = parseInt(newYear, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return;
    }

    // Note: Saving current year is handled by parent component
    // Just trigger the year change
    onYearChange(yearNum, { forceCreate: true });

    fetchYears()
      .then(setYears)
      .catch(() => setYears([]));
    setShowNewYearInput(false);
    setNewYear(String(new Date().getFullYear()));
  };

  const handleYearSelect = (year: number) => {
    // Note: Saving current year is handled by parent component
    onYearChange(year);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-3 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Рік:
        </span>
        <select
          value={currentYear}
          onChange={(e) => handleYearSelect(Number(e.target.value))}
          className="bg-transparent text-sm font-semibold text-foreground outline-none"
        >
          {years.length === 0 ? (
            <option value={currentYear}>{currentYear}</option>
          ) : (
            years.map((year) => (
              <option key={year} value={year}>
                {year} {year === currentYear ? "•" : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {showNewYearInput ? (
        <div className="flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-3 py-1.5">
          <input
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            min={1900}
            max={2100}
            className="w-20 bg-transparent text-sm font-semibold text-foreground outline-none"
            placeholder="Рік"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddYear();
              } else if (e.key === "Escape") {
                setShowNewYearInput(false);
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddYear}
            className="text-xs font-semibold text-accent hover:text-accent-strong"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setShowNewYearInput(false)}
            className="text-xs font-semibold text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewYearInput(true)}
          className="rounded-full border border-card-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
        >
          + Додати рік
        </button>
      )}
    </div>
  );
}
