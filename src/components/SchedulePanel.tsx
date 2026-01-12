import { formatCurrency, formatPercent } from "@/lib/format/currency";
import type { ScheduleItem, ScheduleSplit } from "@/lib/tax/types";

const getLabel = (item: ScheduleItem, year: number, accontoEnabled: boolean) => {
  if (item.key === "june") {
    return accontoEnabled
      ? `Сальдо ${year} + 1-й аконто ${year + 1}`
      : `Сальдо ${year}`;
  }
  return `2-й аконто ${year + 1}`;
};

type SchedulePanelProps = {
  year: number;
  accontoEnabled: boolean;
  split: ScheduleSplit;
  items: ScheduleItem[];
};

export function SchedulePanel({
  year,
  accontoEnabled,
  split,
  items,
}: SchedulePanelProps) {
  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Платежі
      </p>
      <h2 className="mt-2 font-display text-2xl text-foreground">
        Графік
      </h2>
      <p className="mt-2 text-sm text-muted">
        Типові терміни для сальдо та аконто.
      </p>

      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-card-border bg-white/70 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {item.key === "june" ? "Червень" : "Листопад"}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {getLabel(item, year, accontoEnabled)}
                </p>
              </div>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(item.amount)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              {item.saldo > 0 ? (
                <span>Сальдо: {formatCurrency(item.saldo)}</span>
              ) : null}
              {item.acconto > 0 ? (
                <span>Аконто: {formatCurrency(item.acconto)}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {accontoEnabled ? (
        <div className="mt-4 rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
          Аконто розраховано як % від загальної суми поточного року (орієнтовно).
          <span className="ml-2">
            Розподіл: {formatPercent(split.june)} / {formatPercent(split.november)}.
          </span>
          <span className="ml-2">
            Для точних значень зверніться до комерціаліста.
          </span>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
          Аконто вимкнено. Показано лише сальдо.
        </div>
      )}
    </section>
  );
}
