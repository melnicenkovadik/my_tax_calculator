"use client";

import { useState } from "react";
import type { RevenueTransaction } from "@/lib/tax/types";

type TransactionFormProps = {
  onAdd: (transaction: RevenueTransaction) => void;
};

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!date || isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    const transaction: RevenueTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      amount: amountNum,
      description: description.trim() || undefined,
    };

    onAdd(transaction);
    setAmount("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Сума (EUR)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="0.00"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
          >
            Додати
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">
          Опис (необов'язково)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Наприклад: Оплата за проект"
        />
      </div>
    </form>
  );
}
