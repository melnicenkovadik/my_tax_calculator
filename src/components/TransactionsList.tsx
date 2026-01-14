"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/lib/format/currency";
import type { RevenueTransaction } from "@/lib/tax/types";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (!text?.trim()) return null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:bg-accent-wash/50 hover:text-accent"
      aria-label={`Скопіювати ${label}`}
      title={`Скопіювати ${label}`}
    >
      {copied ? (
        <span className="text-[9px] text-green-600" aria-hidden="true">✓</span>
      ) : (
        <span className="text-[9px]" aria-hidden="true">📋</span>
      )}
    </button>
  );
}

type TransactionsListProps = {
  transactions: RevenueTransaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: RevenueTransaction) => void;
  onUploadAttachment?: (transactionId: string, file: File) => void;
  onDeleteAttachment?: (attachmentId: string, transactionId: string) => void;
  emptyMessage?: string;
};

function EmailModal({
  transaction,
  onClose,
}: {
  transaction: RevenueTransaction;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { subject, body } = generateEmailContent(transaction);
  const fullEmail = `To: martina@studiobollani.it\nFrom: melnicenkovadik@gmail.com\nSubject: ${subject}\n\n${body}`;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-card-border bg-card/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Email per commercialista
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted transition hover:bg-white/50 hover:text-foreground"
            aria-label="Закрити"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-card-border bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  To:
                </div>
                <div className="text-sm text-foreground">martina@studiobollani.it</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy("martina@studiobollani.it", "to")}
                className="rounded px-2 py-1 text-xs text-muted transition hover:bg-accent-wash/50 hover:text-accent"
                title="Copia"
              >
                {copiedField === "to" ? "✓" : "📋"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  From:
                </div>
                <div className="text-sm text-foreground">melnicenkovadik@gmail.com</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy("melnicenkovadik@gmail.com", "from")}
                className="rounded px-2 py-1 text-xs text-muted transition hover:bg-accent-wash/50 hover:text-accent"
                title="Copia"
              >
                {copiedField === "from" ? "✓" : "📋"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Subject:
                </div>
                <div className="text-sm font-medium text-foreground">{subject}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(subject, "subject")}
                className="rounded px-2 py-1 text-xs text-muted transition hover:bg-accent-wash/50 hover:text-accent"
                title="Copia"
              >
                {copiedField === "subject" ? "✓" : "📋"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Body:
                </div>
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">{body}</pre>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(body, "body")}
                className="rounded px-2 py-1 text-xs text-muted transition hover:bg-accent-wash/50 hover:text-accent shrink-0"
                title="Copia"
              >
                {copiedField === "body" ? "✓" : "📋"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(fullEmail, "full")}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong flex items-center justify-center gap-2"
          >
            {copiedField === "full" ? (
              <>
                <span>✓</span>
                <span>Copiato!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copia email completo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function generateEmailContent(transaction: RevenueTransaction): { subject: string; body: string } {
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const subject = `Transazione ${formattedDate} - ${formatCurrency(transaction.amount)}`;
  
  const bodyLines: string[] = [];
  
  bodyLines.push(`Data: ${formattedDate}`);
  bodyLines.push(`Importo: ${formatCurrency(transaction.amount)}`);
  
  if (transaction.billTo) {
    bodyLines.push(`\nBill To:\n${transaction.billTo}`);
  }
  
  if (transaction.attachments && transaction.attachments.length > 0) {
    bodyLines.push(`\nAllegati:`);
    transaction.attachments.forEach((att) => {
      bodyLines.push(`- ${att.originalName}: ${att.url}`);
    });
  }
  
  return {
    subject,
    body: bodyLines.join("\n"),
  };
}

export function TransactionsList({
  transactions,
  onDelete,
  onEdit,
  onUploadAttachment,
  onDeleteAttachment,
  emptyMessage,
}: TransactionsListProps) {
  const [emailModalTransaction, setEmailModalTransaction] = useState<RevenueTransaction | null>(null);

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
    <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-card-border bg-white/70">
      <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-white/80 text-[11px] uppercase tracking-[0.2em] text-muted sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-left max-w-[280px]">Опис</th>
              <th className="px-4 py-3 text-left max-w-[220px]">Відправник</th>
              <th className="px-4 py-3 text-left max-w-[280px]">Bill To</th>
              <th className="px-4 py-3 text-left max-w-[250px]">Нотатки</th>
              <th className="px-4 py-3 text-right">Сума</th>
              <th className="px-4 py-3 text-left max-w-[280px]">Вкладення</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border/60">
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="group transition hover:bg-accent-wash/60"
            >
              <td className="px-2 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="mr-1 rounded-full p-0.5 text-base text-muted transition hover:bg-blue-50 hover:text-blue-700"
                  title="Редагувати транзакцію"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailModalTransaction(transaction);
                  }}
                  className="mr-1 rounded-full p-0.5 text-base text-muted transition hover:bg-green-50 hover:text-green-700"
                  title="Показати email для комерціаліста"
                >
                  ✉
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id)}
                  className="rounded-full p-0.5 text-base text-muted transition hover:bg-rose-50 hover:text-rose-600"
                  title="Видалити транзакцію"
                >
                  ✕
                </button>
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-3 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted break-words">{transaction.description?.trim() || "—"}</span>
                  {transaction.description?.trim() && (
                    <CopyButton text={transaction.description.trim()} label="опис" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 max-w-[220px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted break-words">{transaction.sender?.trim() || "—"}</span>
                  {transaction.sender?.trim() && (
                    <CopyButton text={transaction.sender.trim()} label="відправника" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 max-w-[280px] relative">
                {transaction.billTo?.trim() ? (
                  <div className="group/bill flex items-start gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs text-muted font-mono cursor-help">
                        {transaction.billTo.trim().split("\n")[0]?.slice(0, 25) || transaction.billTo.trim().slice(0, 25)}
                        {(transaction.billTo.trim().split("\n")[0]?.length > 25 || transaction.billTo.trim().length > 25 || transaction.billTo.trim().includes("\n")) && "..."}
                      </div>
                    </div>
                    <CopyButton text={transaction.billTo.trim()} label="Bill To" />
                    <div className="absolute left-0 top-full z-[100] mt-1 hidden max-w-[300px] md:max-w-[700px] rounded-lg border border-card-border bg-white p-3 text-[11px] font-mono text-foreground shadow-xl whitespace-pre-wrap group-hover/bill:block pointer-events-none">
                      <div className="font-semibold mb-1.5 text-[10px] uppercase tracking-wider text-muted">Bill To:</div>
                      <div className="text-foreground">{transaction.billTo.trim()}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted/70">—</span>
                )}
              </td>
              <td className="px-4 py-3 max-w-[250px] relative">
                {transaction.notes?.trim() ? (
                  <div className="group/notes flex items-start gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-2 text-xs text-muted cursor-help">
                        {transaction.notes.trim().length > 60
                          ? `${transaction.notes.trim().slice(0, 57)}...`
                          : transaction.notes.trim()}
                      </div>
                    </div>
                    <CopyButton text={transaction.notes.trim()} label="нотатки" />
                    {transaction.notes.trim().length > 60 && (
                      <div className="absolute left-0 top-full z-[100] mt-1 hidden max-w-[300px] md:max-w-[700px] rounded-lg border border-card-border bg-white p-3 text-[11px] text-foreground shadow-xl whitespace-pre-wrap group-hover/notes:block pointer-events-none">
                        <div className="font-semibold mb-1.5 text-[10px] uppercase tracking-wider text-muted">Нотатки:</div>
                        <div className="text-foreground">{transaction.notes.trim()}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted/70">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {formatCurrency(transaction.amount)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5 max-w-[280px]">
                  {transaction.attachments?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {transaction.attachments.map((att) => {
                        const isPdf = att.contentType === "application/pdf";
                        const isImage = att.contentType.startsWith("image/");
                        const fileName = att.originalName.length > 20
                          ? `${att.originalName.slice(0, 17)}...`
                          : att.originalName;
                        const fileSize = att.size < 1024
                          ? `${att.size} B`
                          : att.size < 1024 * 1024
                            ? `${(att.size / 1024).toFixed(1)} KB`
                            : `${(att.size / (1024 * 1024)).toFixed(2)} MB`;

                        return (
                          <div
                            key={att.id}
                            className="group/att inline-flex items-center gap-1.5 rounded-lg border border-card-border/60 bg-white/80 px-2 py-1 text-[11px] transition hover:border-accent/40 hover:bg-white"
                            title={`${att.originalName} (${fileSize})`}
                          >
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-foreground no-underline transition hover:text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isPdf ? (
                                <span className="text-[10px]" aria-hidden="true">📄</span>
                              ) : isImage ? (
                                <span className="text-[10px]" aria-hidden="true">🖼️</span>
                              ) : (
                                <span className="text-[10px]" aria-hidden="true">📎</span>
                              )}
                              <span className="max-w-[140px] truncate font-medium">{fileName}</span>
                              <span className="text-[10px] text-muted">{fileSize}</span>
                            </a>
                            {onDeleteAttachment ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAttachment(att.id, transaction.id);
                                }}
                                className="ml-0.5 rounded px-1 py-0.5 text-[10px] text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover/att:opacity-100"
                                aria-label={`Видалити ${att.originalName}`}
                                title="Видалити файл"
                              >
                                ✕
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted/70">—</span>
                  )}
                  {onUploadAttachment ? (
                    <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-card-border/60 bg-white/50 px-2 py-1 text-[11px] font-medium text-accent transition hover:border-accent/40 hover:bg-accent-wash/30">
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            onUploadAttachment(transaction.id, file);
                            event.target.value = "";
                          }
                        }}
                        aria-label="Додати файл до транзакції"
                      />
                      <span className="text-[10px]" aria-hidden="true">+</span>
                      <span>Додати файл</span>
                    </label>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {emailModalTransaction && (
        <EmailModal
          transaction={emailModalTransaction}
          onClose={() => setEmailModalTransaction(null)}
        />
      )}
    </div>
  );
}
