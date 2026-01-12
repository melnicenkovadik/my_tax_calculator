"use client";

import { TransactionForm } from "./TransactionForm";
import { TransactionsList } from "./TransactionsList";
import type { RevenueTransaction } from "@/lib/tax/types";

type RevenueTransactionsProps = {
  transactions: RevenueTransaction[];
  onAddTransaction: (transaction: RevenueTransaction) => void;
  onDeleteTransaction: (id: string) => void;
};

export function RevenueTransactions({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}: RevenueTransactionsProps) {
  const totalRevenue = transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Доходи
        </p>
        <h2 className="mt-2 font-display text-2xl text-foreground">
          Транзакції доходів
        </h2>
        <p className="mt-2 text-sm text-muted">
          Додавайте доходи по датах. Загальний дохід розраховується автоматично.
        </p>
      </div>

      <div className="mt-6">
        <TransactionForm onAdd={onAddTransaction} />
      </div>

      <div className="mt-6">
        <TransactionsList
          transactions={transactions}
          onDelete={onDeleteTransaction}
          totalRevenue={totalRevenue}
        />
      </div>
    </section>
  );
}
