"use client";

import { useState, useEffect, useRef } from "react";
import { fetchYears, deleteYearData } from "@/lib/storage/years";

type YearsDropdownProps = {
  currentYear: number;
  onYearSelect: (year: number) => void;
  onRefresh?: () => void;
};

export function YearsDropdown({
  currentYear,
  onYearSelect,
  onRefresh,
}: YearsDropdownProps) {
  const [years, setYears] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, [currentYear, onRefresh]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
      >
        Облік {years.length > 0 && `(${years.length})`}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-card-border bg-white shadow-xl">
          <div className="max-h-64 overflow-y-auto p-2">
            {isLoading ? (
              <div className="py-4 text-center text-xs text-muted">
                Завантаження...
              </div>
            ) : years.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted">
                Немає даних
              </div>
            ) : (
              years.map((year) => (
                <div
                  key={year}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-accent-wash/50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onYearSelect(year);
                      setIsOpen(false);
                    }}
                    className={`flex-1 text-left ${
                      year === currentYear
                        ? "font-semibold text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {year} {year === currentYear && "•"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(year, e)}
                    className="ml-2 rounded px-1.5 py-0.5 text-xs text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    title="Видалити рік"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
