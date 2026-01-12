"use client";

import { formatCurrency } from "@/lib/format/currency";
import type { RevenueTransaction } from "@/lib/tax/types";

type TransactionsListProps = {
  transactions: RevenueTransaction[];
  onDelete: (id: string) => void;
  emptyMessage?: string;
};

export function TransactionsList({
  transactions,
  onDelete,
  emptyMessage,
}: TransactionsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-card-border bg-white/60 p-6 text-center text-sm text-muted">
        {emptyMessage ?? "Немає транзакцій. Додайте перший дохід вище."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-card-border bg-white/70">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-white/80 text-[11px] uppercase tracking-[0.2em] text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Дата</th>
            <th className="px-4 py-3 text-left">Опис</th>
            <th className="px-4 py-3 text-right">Сума</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/60">
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="group transition hover:bg-accent-wash/60"
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-3 text-muted">
                {transaction.description?.trim() || "—"}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {formatCurrency(transaction.amount)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id)}
                  className="rounded-full px-2 py-1 text-xs text-muted opacity-70 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                  title="Видалити транзакцію"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
