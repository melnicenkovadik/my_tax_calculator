import { formatCurrency } from "@/lib/format/currency";
import type { ScheduleItem } from "@/lib/tax/types";

export const formatDueDate = (isoDate: string) => isoDate.split("-").reverse().join(".");

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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  до {formatDueDate(item.dueDate)}
                </p>
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
