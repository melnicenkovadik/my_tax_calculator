"use client";

import { formatCurrency } from "@/lib/format/currency";
import type { RevenueTransaction } from "@/lib/tax/types";

type TransactionsListProps = {
  transactions: RevenueTransaction[];
  onDelete: (id: string) => void;
  totalRevenue: number;
};

export function TransactionsList({
  transactions,
  onDelete,
  totalRevenue,
}: TransactionsListProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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
        Немає транзакцій. Додайте перший дохід вище.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-card-border bg-accent-wash px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          Загальний дохід:
        </span>
        <span className="text-base font-semibold text-foreground">
          {formatCurrency(totalRevenue)}
        </span>
      </div>

      <div className="space-y-2">
        {sortedTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="group flex items-center justify-between rounded-xl border border-card-border bg-white/70 px-4 py-3 transition hover:border-foreground/30"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(transaction.date)}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              {transaction.description && (
                <p className="mt-1 text-xs text-muted">
                  {transaction.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDelete(transaction.id)}
              className="ml-4 rounded-full p-1.5 text-xs text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
              title="Видалити транзакцію"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
