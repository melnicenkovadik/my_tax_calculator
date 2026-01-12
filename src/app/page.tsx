"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ImportExportPanel } from "@/components/ImportExportPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SchedulePanel } from "@/components/SchedulePanel";
import { YearSelector } from "@/components/YearSelector";
import { YearsOverview } from "@/components/YearsOverview";
import { RevenueTransactions } from "@/components/RevenueTransactions";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import {
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
} from "@/lib/tax/types";
import {
  calculatorInputValuesSchema,
  parseCalculatorInputs,
} from "@/lib/tax/validation";
import {
  getYearData,
  saveYearData,
  createYearData,
  getAllYears,
} from "@/lib/storage/years";

const defaultInputValues: CalculatorInputValues = {
  year: String(new Date().getFullYear()),
  revenue: "0",
  coeff: "0.67",
  taxRate: "0.05",
  inpsType: "gestione_separata",
  inpsRate: "0.26",
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
  | { type: "import"; values: CalculatorInputValues; defaults?: CalculatorInputValues }
  | { type: "switchYear"; year: number };

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
    case "switchYear": {
      const yearData = getYearData(action.year);
      if (!yearData) {
        return state;
      }
      const fallback =
        parseCalculatorInputs(yearData.defaults).parsed ?? state.lastValid;
      return {
        ...state,
        defaults: yearData.defaults,
        ...applyValues(yearData.inputs, fallback),
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

export default function Home() {
  const [state, dispatch] = useReducer(reducer, {
    values: defaultInputValues,
    defaults: defaultInputValues,
    errors: {},
    lastValid: initialParsed,
    hydrated: false,
  });
  const [importError, setImportError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [yearsRefreshKey, setYearsRefreshKey] = useState(0);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);

  useEffect(() => {
    const currentYearNum = new Date().getFullYear();
    const yearData = getYearData(currentYearNum);
    
    if (yearData) {
      dispatch({ type: "hydrate", values: yearData.inputs, defaults: yearData.defaults });
      setTransactions(yearData.transactions || []);
    } else {
      // Try legacy storage
      const storedDefaults = parseInputValues(readStorage("forfettario.defaults.v1"));
      const defaults = storedDefaults ?? defaultInputValues;
      const storedInputs = parseInputValues(readStorage("forfettario.inputs.v1"));
      const values = storedInputs ?? defaults;
      
      // Migrate to new storage
      if (storedInputs || storedDefaults) {
        saveYearData(createYearData(currentYearNum, values, defaults, []));
      }
      
      dispatch({ type: "hydrate", values, defaults });
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
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
  const schedule = useMemo(
    () => computeSchedule(results.totalDue, state.lastValid.applyAcconti, split),
    [results.totalDue, split, state.lastValid.applyAcconti],
  );
  const summaryText = useMemo(
    () => buildSummary(state.lastValid, results, schedule, split),
    [state.lastValid, results, schedule, split],
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

  const handleImport = (text: string) => {
    try {
      const payload = JSON.parse(text);
      const inputCandidate = payload?.inputs ?? payload;
      const defaultsCandidate = payload?.defaults;
      const importedTransactions = payload?.transactions || [];
      
      const parsedInputs = parseInputValues(inputCandidate);
      if (!parsedInputs) {
        setImportError("Невірний JSON: відсутні дані вводу.");
        return;
      }
      const parsedDefaults = parseInputValues(defaultsCandidate);
      dispatch({
        type: "import",
        values: parsedInputs,
        defaults: parsedDefaults ?? undefined,
      });
      setTransactions(importedTransactions);
      setImportError(null);
    } catch {
      setImportError("Невірний JSON: не вдалося розпарсити файл.");
    }
  };

  const handleYearChange = (year: number) => {
    // Save current year data before switching
    const currentYearNum = parseInt(state.values.year, 10);
    if (!isNaN(currentYearNum)) {
      saveYearData(
        createYearData(currentYearNum, state.values, state.defaults, transactions),
      );
    }

    // Load new year data
    const yearData = getYearData(year);
    if (yearData) {
      dispatch({ type: "switchYear", year });
      setTransactions(yearData.transactions || []);
    } else {
      // Create new year with empty transactions
      const newInputs = { ...state.values, year: String(year) };
      const newDefaults = { ...state.defaults, year: String(year) };
      saveYearData(createYearData(year, newInputs, newDefaults, []));
      dispatch({ type: "switchYear", year });
      setTransactions([]);
    }
    setYearsRefreshKey((k) => k + 1);
  };

  const handleAddTransaction = (transaction: RevenueTransaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const exportPayload = JSON.stringify(
    {
      version: 1,
      inputs: state.values,
      defaults: state.defaults,
      transactions: transactions,
    },
    null,
    2,
  );

  const currentYearNum = parseInt(state.values.year, 10) || new Date().getFullYear();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e4,transparent_55%),radial-gradient(circle_at_right,#e8f3ea,transparent_60%),linear-gradient(180deg,#fff6ed,rgba(255,246,237,0.6))] text-foreground">
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,#f7e0c8,transparent_70%)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-48 h-72 w-72 rounded-full bg-[radial-gradient(circle,#d9ebdf,transparent_70%)] opacity-70 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="animate-fade-up">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Персональний калькулятор
            </div>
            <YearSelector
              currentYear={currentYearNum}
              currentInputs={state.values}
              currentDefaults={state.defaults}
              onYearChange={handleYearChange}
            />
          </div>
          <h1 className="mt-4 font-display text-4xl text-foreground sm:text-5xl">
            Калькулятор податків Italian Forfettario
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Один екран для розрахунку оподатковуваної бази, INPS та imposta sostitutiva
            за режимом Forfettario. Дані зберігаються локально у вашому браузері.
          </p>
        </header>

        <YearsOverview
          key={yearsRefreshKey}
          onYearSelect={handleYearChange}
          onRefresh={() => setYearsRefreshKey((k) => k + 1)}
        />

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "120ms" }}>
            <RevenueTransactions
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
            <CalculatorForm
              values={state.values}
              errors={state.errors}
              onChange={(field, value) =>
                dispatch({ type: "setField", field, value })
              }
              onReset={() => dispatch({ type: "reset" })}
              onSaveDefaults={() => dispatch({ type: "saveDefaults" })}
              canSaveDefaults={Object.keys(state.errors).length === 0}
            />
            <ImportExportPanel
              exportData={exportPayload}
              exportFileName={`forfettario-${state.lastValid.year}.json`}
              onImport={handleImport}
              importError={importError}
            />
          </div>

          <div
            className="space-y-6 animate-fade-in"
            style={{ animationDelay: "220ms" }}
          >
            <ResultsPanel
              results={results}
              inputs={inputsWithTransactions}
              onCopySummary={handleCopySummary}
              copyStatus={copyStatus}
            />
            <SchedulePanel
              year={state.lastValid.year}
              accontoEnabled={state.lastValid.applyAcconti}
              split={split}
              items={schedule}
            />
          </div>
        </div>

        <footer className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
          Орієнтовний калькулятор. Італійські податкові правила можуть відрізнятися; підтвердіть з кваліфікованим
          професіоналом.
        </footer>
      </div>
    </div>
  );
}
