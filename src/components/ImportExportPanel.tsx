import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

const buttonBase =
  "rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground";

type ImportExportPanelProps = {
  exportData: string;
  exportFileName: string;
  onImport: (text: string) => void;
  importError: string | null;
  importStatus?: string | null;
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
};

export function ImportExportPanel({
  exportData,
  exportFileName,
  onImport,
  importError,
  importStatus,
  years,
  selectedYear,
  onYearChange,
}: ImportExportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pasteValue, setPasteValue] = useState("");

  const handleExport = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onImport(String(reader.result ?? ""));
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Резервна копія
      </p>
      <h2 className="mt-2 font-display text-2xl text-foreground">
        Імпорт / експорт
      </h2>
      <p className="mt-2 text-sm text-muted">
        Зберігайте налаштування локально або переносите їх між пристроями.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-3 py-2 text-xs font-semibold text-muted">
          Рік:
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-foreground outline-none"
          >
            {years.length === 0 ? (
              <option value={selectedYear}>{selectedYear}</option>
            ) : (
              years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            )}
          </select>
        </label>
        <button type="button" className={buttonBase} onClick={handleExport}>
          Експортувати JSON
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => inputRef.current?.click()}
        >
          Імпортувати JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
      {importError ? (
        <p className="mt-3 text-xs text-rose-600">{importError}</p>
      ) : importStatus ? (
        <p className="mt-3 text-xs text-emerald-600">{importStatus}</p>
      ) : null}

      <div className="mt-4">
        <label className="block text-xs text-muted">
          Вставте JSON вручну
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder='{"version":1,"inputs":{...},"defaults":{...},"transactions":[...]}'
            className="mt-2 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
            rows={6}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (pasteValue.trim()) {
              onImport(pasteValue);
            }
          }}
          className="mt-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-strong"
          disabled={!pasteValue.trim()}
        >
          Імпортувати з буфера
        </button>
      </div>
    </section>
  );
}
