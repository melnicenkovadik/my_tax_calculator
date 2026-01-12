import { formatCurrency, formatPercent } from "@/lib/format/currency";
import type { CalculatorInputs, CalculatorResults } from "@/lib/tax/types";

type YearSummaryProps = {
  year: number;
  totalRevenue: number;
  transactionCount: number;
  results: CalculatorResults;
  inputs: CalculatorInputs;
};

export function YearSummary({
  year,
  totalRevenue,
  transactionCount,
  results,
  inputs,
}: YearSummaryProps) {
  const averageTransaction =
    transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const monthlyReserve = results.totalDue / 12;
  const revenueNote =
    transactionCount > 0
      ? `${transactionCount} транзакцій · середня ${formatCurrency(averageTransaction)}`
      : "Дохід задано вручну або ще немає транзакцій";
  const inpsRateLabel =
    inputs.inpsType === "gestione_separata"
      ? `Ставка ${formatPercent(inputs.inpsRate)}`
      : "Artigiani/Commercianti";

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Огляд року
          </p>
          <h2 className="mt-2 font-display text-2xl text-foreground">{year}</h2>
          <p className="mt-1 text-sm text-muted">
            Ключові суми та орієнтири для планування платежів.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted">
          {inputs.applyAcconti ? "Аконто увімкнено" : "Аконто вимкнено"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-3">
          <p className="text-xs text-muted">Дохід за рік</p>
          <p className="text-base font-semibold text-foreground">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">{revenueNote}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-card-border bg-accent-wash px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Всього до сплати
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(results.totalDue)}
          </p>
        </div>
        <div className="text-xs text-muted">
          <p>Ефективна ставка: {formatPercent(results.effectiveTotalRate)}</p>
          <p>Орієнтовно {formatCurrency(monthlyReserve)} / міс.</p>
        </div>
      </div>
    </section>
  );
}
