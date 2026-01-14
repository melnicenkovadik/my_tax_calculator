"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TransactionForm } from "./TransactionForm";
import { TransactionsList } from "./TransactionsList";
import { formatCurrency } from "@/lib/format/currency";
import type { RevenueTransaction, TransactionTemplate } from "@/lib/tax/types";

const monthOptions = [
  { value: "all", label: "Всі місяці" },
  { value: "01", label: "Січень" },
  { value: "02", label: "Лютий" },
  { value: "03", label: "Березень" },
  { value: "04", label: "Квітень" },
  { value: "05", label: "Травень" },
  { value: "06", label: "Червень" },
  { value: "07", label: "Липень" },
  { value: "08", label: "Серпень" },
  { value: "09", label: "Вересень" },
  { value: "10", label: "Жовтень" },
  { value: "11", label: "Листопад" },
  { value: "12", label: "Грудень" },
];

type RevenueTransactionsProps = {
  year: number;
  transactions: RevenueTransaction[];
  onAddTransaction: (transaction: RevenueTransaction) => Promise<void> | void;
  onUpdateTransaction: (transaction: RevenueTransaction) => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onBulkDeleteTransactions?: (ids: string[]) => Promise<void> | void;
  onUploadAttachment?: (transactionId: string, file: File) => Promise<void> | void;
  onDeleteAttachment?: (attachmentId: string, transactionId: string) => Promise<void> | void;
  templateToApply?: TransactionTemplate | null;
  onTemplateApplied?: () => void;
};

export function RevenueTransactions({
  year,
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onBulkDeleteTransactions,
  onUploadAttachment,
  onDeleteAttachment,
  templateToApply,
  onTemplateApplied,
}: RevenueTransactionsProps) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueTransaction | null>(null);

  const totalRevenue = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = transactions.filter((transaction) => {
      if (
        monthFilter !== "all" &&
        transaction.date.slice(5, 7) !== monthFilter
      ) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${transaction.description ?? ""} ${transaction.sender ?? ""} ${transaction.billTo ?? ""} ${transaction.notes ?? ""} ${transaction.causale ?? ""} ${transaction.date}`
          .toLowerCase()
          .trim();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "amount_asc") return a.amount - b.amount;
      if (sortBy === "amount_desc") return b.amount - a.amount;

      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      return sortBy === "date_asc" ? aDate - bDate : bDate - aDate;
    });

    return sorted;
  }, [transactions, query, monthFilter, sortBy]);

  const filteredTotal = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const averageTransaction =
    transactions.length > 0 ? totalRevenue / transactions.length : 0;

  const filtersActive = query.trim().length > 0 || monthFilter !== "all";

  const pendingTransaction = useMemo(
    () => transactions.find((t) => t.id === pendingDeleteId),
    [pendingDeleteId, transactions],
  );

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const cancelDelete = () => setPendingDeleteId(null);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await onDeleteTransaction(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleSubmit = async (transaction: RevenueTransaction) => {
    if (editing && editing.id === transaction.id) {
      await onUpdateTransaction(transaction);
      setEditing(null);
      setIsModalOpen(false);
      return;
    }
    await onAddTransaction(transaction);
    setIsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction: RevenueTransaction) => {
    setEditing(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  useEffect(() => {
    if (templateToApply && !isModalOpen) {
      setIsModalOpen(true);
      setEditing(null);
    }
  }, [templateToApply, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen && templateToApply && onTemplateApplied) {
      onTemplateApplied();
    }
  }, [isModalOpen, templateToApply, onTemplateApplied]);

  return (
    <section className="rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Журнал доходів
          </p>
          <h2 className="mt-2 font-display text-2xl text-foreground">
            Транзакції за {year}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Повний список доходів за рік з пошуком та фільтрами.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
        >
          + Додати транзакцію
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-2">
          <p className="text-xs text-muted">Всього за рік</p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-2">
          <p className="text-xs text-muted">Транзакцій</p>
          <p className="text-sm font-semibold text-foreground">
            {transactions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-2">
          <p className="text-xs text-muted">Середня транзакція</p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(averageTransaction)}
          </p>
        </div>
        {filtersActive ? (
          <div className="rounded-2xl border border-card-border bg-accent-wash px-4 py-2">
            <p className="text-xs text-muted">Фільтрований дохід</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(filteredTotal)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_auto]">
        <label className="text-xs text-muted">
          Пошук
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Наприклад: рахунок, 2024-06-01"
            className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <label className="text-xs text-muted">
          Місяць
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Сортування
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="date_desc">Найновіші</option>
            <option value="date_asc">Найстаріші</option>
            <option value="amount_desc">Сума ↓</option>
            <option value="amount_asc">Сума ↑</option>
          </select>
        </label>
        {filtersActive ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setMonthFilter("all");
            }}
            className="self-end rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
          >
            Скинути фільтри
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <TransactionsList
          transactions={filteredTransactions}
          onDelete={requestDelete}
          onBulkDelete={onBulkDeleteTransactions}
          onEdit={handleOpenEditModal}
          onUploadAttachment={onUploadAttachment}
          onDeleteAttachment={onDeleteAttachment}
          emptyMessage={
            transactions.length === 0
              ? "Немає транзакцій. Додайте перший дохід вище."
              : "Немає транзакцій за цими фільтрами."
          }
        />
      </div>

      {isModalOpen && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleCloseModal}
              />
              <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-card-border bg-card/95 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {editing ? "Редагувати транзакцію" : "Додати транзакцію"}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-full p-1 text-muted transition hover:bg-white/50 hover:text-foreground"
                    aria-label="Закрити"
                  >
                    ✕
                  </button>
                </div>
                <TransactionForm
                  onSubmit={handleSubmit}
                  editing={editing}
                  onCancelEdit={handleCloseModal}
                  onUploadAttachment={onUploadAttachment}
                  onDeleteAttachment={onDeleteAttachment}
                  templateToApply={templateToApply}
                  onTemplateApplied={onTemplateApplied}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      {pendingTransaction && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md rounded-2xl border border-card-border bg-card/95 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-foreground">Видалити транзакцію?</h3>
                <p className="mt-2 text-sm text-muted">
                  Це дію не можна скасувати. Переконайтеся, що видаляєте потрібний запис.
                </p>
                <div className="mt-4 rounded-xl border border-card-border bg-white/70 p-3 text-sm text-foreground">
                  <p className="font-semibold">
                    {formatCurrency(pendingTransaction.amount)} · {pendingTransaction.date}
                  </p>
                  <p className="text-muted">
                    {pendingTransaction.description?.trim() || "Без опису"}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="rounded-full border border-card-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
                  >
                    Скасувати
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
