import { useSyncExternalStore } from "react";
import { formatCurrency } from "@/lib/format/currency";
import { daysUntil, deadlineTone, type DeadlineTone } from "@/lib/tax/calculations";
import type { ScheduleItem } from "@/lib/tax/types";

export const formatDueDate = (isoDate: string) => isoDate.split("-").reverse().join(".");

const toneClasses: Record<DeadlineTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  soon: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  past: "border-card-border bg-white/70 text-muted",
};

const pluralDays = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дні";
  return "днів";
};

const daysLabel = (days: number) => {
  if (days < 0) return "строк минув";
  if (days === 0) return "сьогодні";
  return `ще ${days} ${pluralDays(days)}`;
};

const subscribeNever = () => () => {};
// Local calendar date as YYYY-MM-DD.
const getToday = () => new Date().toLocaleDateString("sv-SE");

const getLabel = (item: ScheduleItem, year: number) =>
  item.key === "saldo" ? `Сальдо ${year} + 1-й аконто ${year + 1}` : `2-й аконто ${year + 1}`;

type SchedulePanelProps = {
  year: number;
  items: ScheduleItem[];
  inpsAccontiPaid: number;
  taxAccontiPaid: number;
};

export function SchedulePanel({
  year,
  items,
  inpsAccontiPaid,
  taxAccontiPaid,
}: SchedulePanelProps) {
  // WHY: "today" is only known in the browser; the server snapshot renders no badge, avoiding a hydration mismatch.
  const today = useSyncExternalStore(subscribeNever, getToday, () => null);

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Платежі
      </p>
      <h2 className="mt-2 font-display text-2xl text-foreground">
        Графік
      </h2>
      <p className="mt-2 text-sm text-muted">
        Що і до якої дати платити в {year + 1} за {year} рік.
      </p>

      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-card-border bg-white/70 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    до {formatDueDate(item.dueDate)}
                  </p>
                  {today ? (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        toneClasses[deadlineTone(daysUntil(item.dueDate, today))]
                      }`}
                    >
                      {daysLabel(daysUntil(item.dueDate, today))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {getLabel(item, year)}
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
              {item.saldo < 0 ? (
                <span>Переплата: {formatCurrency(-item.saldo)} (зменшує платежі)</span>
              ) : null}
              {item.acconto > 0 ? (
                <span>Аконто: {formatCurrency(item.acconto)}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-xs text-muted">
        Враховано вже сплачені аванси за {year}: INPS {formatCurrency(inpsAccontiPaid)}, податок{" "}
        {formatCurrency(taxAccontiPaid)}. Аконто: INPS 40% + 40%, податок 50% + 50% (до 103 € — усе в
        листопаді). Літній строк щороку можуть перенести; його можна розбити на частини до грудня з
        відсотками. Точні суми — у комерціаліста.
      </div>
    </section>
  );
}
