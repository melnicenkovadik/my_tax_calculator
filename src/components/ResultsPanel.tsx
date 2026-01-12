import { formatCurrency, formatPercent } from "@/lib/format/currency";
import type { CalculatorInputs, CalculatorResults } from "@/lib/tax/types";
import { useUiStore } from "@/lib/state/ui";

const rowBase = "flex items-center justify-between gap-4 py-2";

const labelBase = "text-sm font-medium text-foreground";
const valueBase = "text-sm font-semibold text-foreground";

type ResultsPanelProps = {
  results: CalculatorResults;
  inputs: CalculatorInputs;
  onCopySummary: () => void;
  copyStatus: string | null;
};

export function ResultsPanel({
  results,
  inputs,
  onCopySummary,
  copyStatus,
}: ResultsPanelProps) {
  const resultsCollapsed = useUiStore((state) => state.resultsCollapsed);
  const toggleResults = useUiStore((state) => state.toggleResults);

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Результати
          </p>
          <h2 className="mt-2 font-display text-2xl text-foreground">
            Розбивка
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
              onClick={onCopySummary}
            >
              Копіювати підсумок
            </button>
            <button
              type="button"
              onClick={toggleResults}
              className="rounded-full border border-card-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
            >
              {resultsCollapsed ? "Розгорнути" : "Згорнути"}
            </button>
          </div>
          {copyStatus ? (
            <span className="text-xs text-muted">{copyStatus}</span>
          ) : null}
        </div>
      </div>

      {!resultsCollapsed && (
        <div className="mt-6 divide-y divide-dashed divide-card-border">
          <div className={rowBase}>
            <div>
              <p className={labelBase}>Оподатковувана база</p>
              <p className="text-xs text-muted">Дохід × коефіцієнт</p>
            </div>
            <p className={valueBase}>{formatCurrency(results.taxableBase)}</p>
          </div>

          <div className={rowBase}>
            <div>
              <p className={labelBase}>INPS</p>
              <p className="text-xs text-muted">
                {inputs.inpsType === "gestione_separata"
                  ? `Gestione Separata (${formatPercent(inputs.inpsRate)})`
                  : "Artigiani/Commercianti (не змодельовано)"}
              </p>
            </div>
            <p className={valueBase}>{formatCurrency(results.inps)}</p>
          </div>

          <div className={rowBase}>
            <div>
              <p className={labelBase}>Податкова база після відрахування INPS</p>
              <p className="text-xs text-muted">
                {inputs.inpsDeductible ? "Відрахування застосовано" : "Відрахування вимкнено"}
              </p>
            </div>
            <p className={valueBase}>{formatCurrency(results.baseAfterDeduction)}</p>
          </div>

          <div className={rowBase}>
            <div>
              <p className={labelBase}>Imposta sostitutiva</p>
              <p className="text-xs text-muted">
                {formatPercent(inputs.taxRate)} від податкової бази
              </p>
            </div>
            <p className={valueBase}>{formatCurrency(results.tax)}</p>
          </div>
        </div>
      )}

      {!resultsCollapsed && (
        <div className="mt-6 rounded-2xl border border-card-border bg-accent-wash px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Всього до сплати</p>
            <p className="text-base font-semibold text-foreground">
              {formatCurrency(results.totalDue)}
            </p>
          </div>
        </div>
      )}

      {!resultsCollapsed && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-foreground">Ефективні ставки</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-card-border bg-white/70 px-3 py-2">
              <p className="text-xs text-muted">INPS / дохід</p>
              <p className="text-sm font-semibold text-foreground">
                {formatPercent(results.effectiveInpsRate)}
              </p>
            </div>
            <div className="rounded-2xl border border-card-border bg-white/70 px-3 py-2">
              <p className="text-xs text-muted">Податок / дохід</p>
              <p className="text-sm font-semibold text-foreground">
                {formatPercent(results.effectiveTaxRate)}
              </p>
            </div>
            <div className="rounded-2xl border border-card-border bg-white/70 px-3 py-2">
              <p className="text-xs text-muted">Всього / дохід</p>
              <p className="text-sm font-semibold text-foreground">
                {formatPercent(results.effectiveTotalRate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
