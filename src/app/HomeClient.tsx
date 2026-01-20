"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SchedulePanel } from "@/components/SchedulePanel";
import { YearsDropdown } from "@/components/YearsDropdown";
import { YearSummary } from "@/components/YearSummary";
import { RevenueTransactions } from "@/components/RevenueTransactions";
import { TemplatesModal } from "@/components/TemplatesModal";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import {
  computeAccontoBase,
  computeSchedule,
  computeTotals,
  resolveScheduleSplit,
} from "@/lib/tax/calculations";
import type {
  CalculatorInputValues,
  CalculatorInputs,
  ScheduleItem,
  ScheduleSplit,
  RevenueTransaction,
  YearData,
  TransactionTemplate,
} from "@/lib/tax/types";
import {
  calculatorInputValuesSchema,
  parseCalculatorInputs,
} from "@/lib/tax/validation";
import {
  fetchYearData,
  saveYearData,
  createYearData,
  deleteTransaction,
} from "@/lib/storage/years";
import {
  createTransaction,
  updateTransaction,
  uploadAttachment,
  deleteAttachment,
} from "@/lib/storage/years";

const defaultInputValues: CalculatorInputValues = {
  year: String(new Date().getFullYear()),
  revenue: "0",
  coeff: "0.67",
  taxRate: "0.05",
  inpsType: "gestione_separata",
  inpsRate: "0.2607",
  inpsDeductible: true,
  applyAcconti: true,
  splitModel: "standard",
  customSplitJune: "0.4",
  customSplitNovember: "0.6",
};

const initialParsed = parseCalculatorInputs(defaultInputValues)
  .parsed as CalculatorInputs;

type State = {
  values: CalculatorInputValues;
  defaults: CalculatorInputValues;
  errors: Record<string, string>;
  lastValid: CalculatorInputs;
  hydrated: boolean;
};

type Action =
  | {
      type: "hydrate";
      values: CalculatorInputValues;
      defaults: CalculatorInputValues;
    }
  | {
      type: "setField";
      field: keyof CalculatorInputValues;
      value: string | boolean;
    }
  | { type: "reset" }
  | { type: "saveDefaults" }
  | { type: "import"; values: CalculatorInputValues; defaults?: CalculatorInputValues };

const applyValues = (
  values: CalculatorInputValues,
  fallback: CalculatorInputs,
) => {
  const { parsed, errors } = parseCalculatorInputs(values);
  return {
    values,
    errors,
    lastValid: parsed ?? fallback,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "hydrate": {
      const fallback =
        parseCalculatorInputs(action.defaults).parsed ?? state.lastValid;
      return {
        ...state,
        defaults: action.defaults,
        hydrated: true,
        ...applyValues(action.values, fallback),
      };
    }
    case "setField": {
      const nextValues = {
        ...state.values,
        [action.field]: action.value,
      } as CalculatorInputValues;
      return {
        ...state,
        ...applyValues(nextValues, state.lastValid),
      };
    }
    case "reset": {
      const fallback =
        parseCalculatorInputs(state.defaults).parsed ?? state.lastValid;
      return {
        ...state,
        ...applyValues(state.defaults, fallback),
      };
    }
    case "saveDefaults": {
      if (Object.keys(state.errors).length > 0) {
        return state;
      }
      return {
        ...state,
        defaults: state.values,
      };
    }
    case "import": {
      const fallback =
        parseCalculatorInputs(action.values).parsed ?? state.lastValid;
      return {
        ...state,
        defaults: action.defaults ?? state.defaults,
        ...applyValues(action.values, fallback),
      };
    }
    default:
      return state;
  }
};

const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parseInputValues = (payload: unknown) => {
  const result = calculatorInputValuesSchema.safeParse(payload);
  return result.success ? result.data : null;
};

const buildSummary = (
  inputs: CalculatorInputs,
  results: ReturnType<typeof computeTotals>,
  schedule: ScheduleItem[],
  split: ScheduleSplit,
) => {
  const lines: string[] = [
    `Калькулятор податків Italian Forfettario (${inputs.year})`,
    `Дохід: ${formatCurrency(inputs.revenue)}`,
    `Коефіцієнт: ${inputs.coeff.toFixed(2)}`,
    `Оподатковувана база: ${formatCurrency(results.taxableBase)}`,
    `INPS (${inputs.inpsType === "gestione_separata" ? "Gestione Separata" : "Artigiani/Commercianti"} ${
      inputs.inpsType === "gestione_separata" ? formatPercent(inputs.inpsRate) : ""
    }): ${formatCurrency(results.inps)}`,
    `Податкова база після відрахування INPS: ${formatCurrency(
      results.baseAfterDeduction,
    )}`,
    `Imposta sostitutiva (${formatPercent(inputs.taxRate)}): ${formatCurrency(
      results.tax,
    )}`,
    `Всього до сплати: ${formatCurrency(results.totalDue)}`,
  ];

  if (inputs.applyAcconti) {
    lines.push("Графік платежів (орієнтовно):");
    schedule.forEach((item) => {
      if (item.key === "june") {
        lines.push(
          `Червень: Сальдо ${inputs.year} + 1-й аконто ${inputs.year + 1} = ${formatCurrency(
            item.amount,
          )}`,
        );
      } else {
        lines.push(
          `Листопад: 2-й аконто ${inputs.year + 1} = ${formatCurrency(
            item.amount,
          )}`,
        );
      }
    });
    lines.push(
      `Розподіл аконто: ${formatPercent(split.june)} / ${formatPercent(
        split.november,
      )} (орієнтовно на основі загальної суми поточного року).`,
    );
  } else {
    const june = schedule[0];
    lines.push(
      `Графік: Сальдо за червень ${inputs.year} = ${formatCurrency(
        june?.amount ?? 0,
      )}`,
    );
  }

  return lines.join("\n");
};

type HomeClientProps = {
  initialYear: number;
  initialData: YearData | null;
};

export function HomeClient({ initialYear, initialData }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, {
    values: initialData?.inputs ?? { ...defaultInputValues, year: String(initialYear) },
    defaults: initialData?.defaults ?? { ...defaultInputValues, year: String(initialYear) },
    errors: {},
    lastValid: initialData
      ? (parseCalculatorInputs(initialData.inputs).parsed ?? initialParsed)
      : initialParsed,
    hydrated: !!initialData,
  });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [yearsRefreshKey, setYearsRefreshKey] = useState(0);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>(
    initialData?.transactions ?? [],
  );
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<TransactionTemplate | null>(null);
  const hasPersistedOnce = useRef(false);
  const pendingYearChange = useRef<{ year: number; forceCreate?: boolean } | null>(null);

  // Sync URL with year changes
  useEffect(() => {
    if (!state.hydrated) return;
    const yearNum = parseInt(state.values.year, 10);
    const urlYear = searchParams.get("year");
    if (!isNaN(yearNum) && urlYear !== String(yearNum)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("year", String(yearNum));
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [state.values.year, state.hydrated, router, searchParams]);

  // Load data when year changes from URL
  useEffect(() => {
    const urlYear = searchParams.get("year");
    if (!urlYear) return;
    const yearNum = parseInt(urlYear, 10);
    if (isNaN(yearNum)) return;
    const currentYearNum = parseInt(state.values.year, 10);
    if (yearNum === currentYearNum) return;

    let cancelled = false;
    const load = async () => {
      try {
        let yearData = await fetchYearData(yearNum);
        const pending = pendingYearChange.current;
        const shouldForceCreate = pending?.year === yearNum && pending.forceCreate;
        if (!yearData && shouldForceCreate) {
          const newInputs = { ...state.values, year: String(yearNum) };
          const newDefaults = { ...state.defaults, year: String(yearNum) };
          yearData = createYearData(yearNum, newInputs, newDefaults, []);
          await saveYearData(yearData);
        }
        if (cancelled) return;
        if (yearData) {
          dispatch({ type: "hydrate", values: yearData.inputs, defaults: yearData.defaults });
          setTransactions(Array.isArray(yearData.transactions) ? yearData.transactions : []);
        }
        if (pending?.year === yearNum) {
          pendingYearChange.current = null;
        }
      } catch {
        if (cancelled) return;
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, state.values.year]);

  useEffect(() => {
    if (!state.hydrated) return;
    if (!hasPersistedOnce.current) {
      hasPersistedOnce.current = true;
      return; // Skip first run on mount to avoid overwriting freshly loaded data
    }
    const yearNum = parseInt(state.values.year, 10);
    if (!isNaN(yearNum)) {
      saveYearData(createYearData(yearNum, state.values, state.defaults, transactions));
    }
  }, [state.hydrated, state.values, state.defaults, transactions]);

  // Calculate total revenue from transactions
  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Update revenue in calculations if transactions exist
  const inputsWithTransactions = useMemo(() => {
    if (transactions.length > 0) {
      return { ...state.lastValid, revenue: totalRevenue };
    }
    return state.lastValid;
  }, [state.lastValid, transactions, totalRevenue]);

  const results = useMemo(
    () => computeTotals(inputsWithTransactions),
    [inputsWithTransactions],
  );
  const split = useMemo(
    () => resolveScheduleSplit(state.lastValid),
    [state.lastValid],
  );
  const accontoBase = useMemo(
    () => computeAccontoBase(results.inps, results.tax),
    [results.inps, results.tax],
  );
  const schedule = useMemo(
    () => computeSchedule(results.totalDue, accontoBase, state.lastValid.applyAcconti, split),
    [results.totalDue, accontoBase, split, state.lastValid.applyAcconti],
  );
  const summaryText = useMemo(
    () => buildSummary(inputsWithTransactions, results, schedule, split),
    [inputsWithTransactions, results, schedule, split],
  );

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyStatus("Скопійовано");
    } catch {
      setCopyStatus("Помилка копіювання");
    }
    window.setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleYearChange = async (year: number, opts?: { forceCreate?: boolean }) => {
    // Save current year data before switching
    const currentYearNum = parseInt(state.values.year, 10);
    if (!isNaN(currentYearNum)) {
      await saveYearData(
        createYearData(currentYearNum, state.values, state.defaults, transactions),
      );
    }

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    pendingYearChange.current = { year, forceCreate: opts?.forceCreate };
    router.replace(`/?${params.toString()}`, { scroll: false });
    setYearsRefreshKey((k) => k + 1);
  };

  const handleAddTransaction = async (transaction: RevenueTransaction) => {
    const yearNum = parseInt(state.values.year, 10);
    const created =
      !Number.isNaN(yearNum) && state.hydrated
        ? await createTransaction(yearNum, transaction)
        : null;
    const nextTransaction: RevenueTransaction = {
      ...transaction,
      ...(created ?? {}),
      attachments: transaction.attachments ?? [],
    };
    setTransactions((prev) => [...prev, nextTransaction]);
  };

  const handleUpdateTransaction = async (transaction: RevenueTransaction) => {
    const updated = await updateTransaction(transaction.id, transaction);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id
          ? {
              ...t,
              ...transaction,
              ...(updated ?? {}),
              attachments: t.attachments ?? [],
            }
          : t,
      ),
    );
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await deleteTransaction(id);
  };

  const handleBulkDeleteTransactions = async (ids: string[]) => {
    if (ids.length === 0) return;
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    await Promise.all(ids.map((id) => deleteTransaction(id)));
  };

  const handleUploadAttachment = async (transactionId: string, file: File) => {
    const uploaded = await uploadAttachment(transactionId, file);
    if (!uploaded) return;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, attachments: [...(t.attachments ?? []), uploaded] }
          : t,
      ),
    );
  };

  const handleDeleteAttachment = async (attachmentId: string, transactionId: string) => {
    const ok = await deleteAttachment(attachmentId);
    if (!ok) return;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              attachments: (t.attachments ?? []).filter((att) => att.id !== attachmentId),
            }
          : t,
      ),
    );
  };

  const handleOpenCalculatorModal = () => {
    setIsCalculatorModalOpen(true);
  };

  const handleCloseCalculatorModal = () => {
    setIsCalculatorModalOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCalculatorModalOpen) {
        handleCloseCalculatorModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isCalculatorModalOpen]);

  const currentYearNum = parseInt(state.values.year, 10) || initialYear;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e4,transparent_55%),radial-gradient(circle_at_right,#e8f3ea,transparent_60%),linear-gradient(180deg,#fff6ed,rgba(255,246,237,0.6))] text-foreground">
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,#f7e0c8,transparent_70%)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-48 h-72 w-72 rounded-full bg-[radial-gradient(circle,#d9ebdf,transparent_70%)] opacity-70 blur-3xl" />

      <div className="relative flex w-full flex-col gap-8 px-3 py-8 sm:px-[10px] sm:py-12">
        <header className="animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <YearsDropdown
                currentYear={currentYearNum}
                onYearSelect={handleYearChange}
                onRefresh={() => setYearsRefreshKey((k) => k + 1)}
                refreshKey={yearsRefreshKey}
              />
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="w-full rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground sm:w-auto"
              >
                Templates
              </button>
              <button
                type="button"
                onClick={handleOpenCalculatorModal}
                className="w-full rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground sm:w-auto"
              >
                Вхідні дані
              </button>
              <Link
                href="/backup"
                className="w-full rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground sm:w-auto"
              >
                Резервна копія
              </Link>
            </div>
          </div>
        </header>

        <div className="animate-fade-in" style={{ animationDelay: "180ms" }}>
        <RevenueTransactions
          year={currentYearNum}
          transactions={transactions}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onBulkDeleteTransactions={handleBulkDeleteTransactions}
          templateToApply={templateToApply}
          onTemplateApplied={() => setTemplateToApply(null)}
        />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <YearSummary
            year={currentYearNum}
            totalRevenue={inputsWithTransactions.revenue}
            transactionCount={transactions.length}
            results={results}
            inputs={inputsWithTransactions}
          />

          <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
            <ResultsPanel
              results={results}
              inputs={inputsWithTransactions}
              onCopySummary={handleCopySummary}
              copyStatus={copyStatus}
            />
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "240ms" }}>
          <SchedulePanel
            year={state.lastValid.year}
            accontoEnabled={state.lastValid.applyAcconti}
            split={split}
            items={schedule}
          />
        </div>

        <footer className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
          Орієнтовний калькулятор. Італійські податкові правила можуть відрізнятися; підтвердіть з кваліфікованим
          професіоналом.
        </footer>
      </div>

      {isCalculatorModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleCloseCalculatorModal}
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-card-border bg-card/95 shadow-2xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-card-border bg-card/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Вхідні дані
                </p>
                <h2 className="mt-1 font-display text-2xl text-foreground">
                  Ваші припущення
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseCalculatorModal}
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
              <CalculatorForm
                values={state.values}
                errors={state.errors}
                onChange={(field, value) =>
                  dispatch({ type: "setField", field, value })
                }
                onReset={() => dispatch({ type: "reset" })}
                onSaveDefaults={() => {
                  dispatch({ type: "saveDefaults" });
                }}
                canSaveDefaults={Object.keys(state.errors).length === 0}
                isInModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {isTemplatesModalOpen && (
        <TemplatesModal
          onClose={() => setIsTemplatesModalOpen(false)}
          onSelectTemplate={(template) => {
            setTemplateToApply(template);
            setIsTemplatesModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
