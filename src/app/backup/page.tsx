"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImportExportPanel } from "@/components/ImportExportPanel";
import { calculatorInputValuesSchema } from "@/lib/tax/validation";
import {
  fetchYearData,
  createYearData,
  saveYearData,
  fetchYears,
} from "@/lib/storage/years";
import type { CalculatorInputValues, RevenueTransaction } from "@/lib/tax/types";

const parseInputValues = (payload: unknown) => {
  const result = calculatorInputValuesSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export default function BackupPage() {
  const [exportData, setExportData] = useState<string>("");
  const [exportFileName, setExportFileName] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);

  const loadYear = async (yearNum: number) => {
    try {
      const yearData = await fetchYearData(yearNum);
      if (yearData) {
        const payload = JSON.stringify(
          {
            version: 1,
            inputs: yearData.inputs,
            defaults: yearData.defaults,
            transactions: yearData.transactions || [],
          },
          null,
          2,
        );
        setExportData(payload);
        setExportFileName(`forfettario-${yearNum}.json`);
      } else {
        const emptyPayload = JSON.stringify(
          {
            version: 1,
            inputs: {
              year: String(yearNum),
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
            },
            defaults: {
              year: String(yearNum),
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
            },
            transactions: [],
          },
          null,
          2,
        );
        setExportData(emptyPayload);
        setExportFileName(`forfettario-${yearNum}.json`);
      }
    } catch (error) {
      console.error("Failed to load year data:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const currentYearNum = new Date().getFullYear();
      const list = await fetchYears();
      const unique = Array.from(new Set([...list, currentYearNum])).sort((a, b) => b - a);
      setYears(unique);
      setCurrentYear(currentYearNum);
      await loadYear(currentYearNum);
    };
    init();
  }, []);

  const refreshYearsList = async (yearHint: number) => {
    const list = await fetchYears();
    const unique = Array.from(new Set([...list, yearHint])).sort((a, b) => b - a);
    setYears(unique);
  };

  const handleImport = async (text: string) => {
    try {
      setImportError(null);
      setImportStatus(null);
      const payload = JSON.parse(text);
      const inputCandidate = payload?.inputs ?? payload;
      const defaultsCandidate = payload?.defaults;
      const importedTransactions = Array.isArray(payload?.transactions)
        ? payload.transactions
        : [];

      const parsedInputs = parseInputValues(inputCandidate);
      if (!parsedInputs) {
        setImportError("Invalid JSON: missing input data.");
        return;
      }
      const parsedDefaults = parseInputValues(defaultsCandidate);

      const targetYear = currentYear;
      const normalizedInputs: CalculatorInputValues = {
        ...parsedInputs,
        year: String(targetYear),
      };
      const normalizedDefaults: CalculatorInputValues = {
        ...(parsedDefaults ?? parsedInputs),
        year: String(targetYear),
      };

      saveYearData(
        createYearData(
          targetYear,
          normalizedInputs,
          normalizedDefaults,
          importedTransactions,
        ),
      );

      setCurrentYear(targetYear);
      await refreshYearsList(targetYear);
      const verified = await fetchYearData(targetYear);
      if (!verified) {
        setImportError("Не вдалося зчитати збережені дані після імпорту.");
        setImportStatus(null);
        return;
      }
      await loadYear(targetYear);
      const updatedPayload = JSON.stringify(
        {
          version: 1,
          inputs: verified.inputs,
          defaults: verified.defaults,
          transactions: verified.transactions || [],
        },
        null,
        2,
      );
      setExportData(updatedPayload);
      setExportFileName(`forfettario-${targetYear}.json`);
      setImportStatus("Імпортовано успішно.");
    } catch {
      setImportError("Invalid JSON: failed to parse file.");
      setImportStatus(null);
    }
  };

  const handleYearChange = async (year: number) => {
    setCurrentYear(year);
    await loadYear(year);
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e4,transparent_55%),radial-gradient(circle_at_right,#e8f3ea,transparent_60%),linear-gradient(180deg,#fff6ed,rgba(255,246,237,0.6))] text-foreground">
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,#f7e0c8,transparent_70%)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-48 h-72 w-72 rounded-full bg-[radial-gradient(circle,#d9ebdf,transparent_70%)] opacity-70 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="animate-fade-up">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-foreground/30 hover:text-foreground"
            >
              ← На головну
            </Link>
          </div>
          <h1 className="mt-4 font-display text-4xl text-foreground sm:text-5xl">
            Резервна копія
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Експортуйте або імпортуйте дані для збереження та перенесення між пристроями.
          </p>
        </header>

        <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
          <ImportExportPanel
            exportData={exportData}
            exportFileName={exportFileName}
            onImport={handleImport}
            importError={importError}
            importStatus={importStatus}
            years={years}
            selectedYear={currentYear}
            onYearChange={handleYearChange}
          />
        </div>

        <footer className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
          Орієнтовний калькулятор. Італійські податкові правила можуть відрізнятися; підтвердіть з кваліфікованим
          професіоналом.
        </footer>
      </div>
    </div>
  );
}
