import type { ChangeEvent } from "react";
import { useRef } from "react";

const buttonBase =
  "rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground";

type ImportExportPanelProps = {
  exportData: string;
  exportFileName: string;
  onImport: (text: string) => void;
  importError: string | null;
};

export function ImportExportPanel({
  exportData,
  exportFileName,
  onImport,
  importError,
}: ImportExportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    <section className="rounded-3xl border border-card-border bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
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
      ) : null}
    </section>
  );
}
