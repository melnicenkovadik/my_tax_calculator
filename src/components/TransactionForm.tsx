"use client";

import { useEffect, useState } from "react";
import { fetchTemplates } from "@/lib/storage/templates";
import type { RevenueTransaction, TransactionAttachment, TransactionTemplate } from "@/lib/tax/types";

type TransactionFormProps = {
  onSubmit: (transaction: RevenueTransaction) => void;
  editing?: RevenueTransaction | null;
  onCancelEdit?: () => void;
  onUploadAttachment?: (transactionId: string, file: File) => Promise<void> | void;
  onDeleteAttachment?: (attachmentId: string, transactionId: string) => Promise<void> | void;
  templateToApply?: TransactionTemplate | null;
  onTemplateApplied?: () => void;
};

export function TransactionForm({
  onSubmit,
  editing = null,
  onCancelEdit,
  onUploadAttachment,
  onDeleteAttachment,
  templateToApply,
  onTemplateApplied,
}: TransactionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [sender, setSender] = useState("");
  const [billTo, setBillTo] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setAmount(String(editing.amount));
      setDescription(editing.description ?? "");
      setSender(editing.sender ?? "");
      setBillTo(editing.billTo ?? "");
      setNotes(editing.notes ?? "");
      setSelectedTemplateId("");
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setDescription("");
      setSender("");
      setBillTo("");
      setNotes("");
      setSelectedTemplateId("");
    }
  }, [editing]);

  useEffect(() => {
    if (templateToApply && !editing) {
      setSender(templateToApply.sender ?? "");
      setBillTo(templateToApply.billTo ?? "");
      setNotes(templateToApply.notes ?? "");
      setSelectedTemplateId(templateToApply.id);
      if (onTemplateApplied) {
        onTemplateApplied();
      }
    }
  }, [templateToApply, editing, onTemplateApplied]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await fetchTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to load templates", error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSender(template.sender ?? "");
        setBillTo(template.billTo ?? "");
        setNotes(template.notes ?? "");
      }
    } else {
      setSender("");
      setBillTo("");
      setNotes("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!date || isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    const transaction: RevenueTransaction = {
      id:
        editing?.id ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
      date,
      amount: amountNum,
      description: description.trim() || undefined,
      sender: sender.trim() || undefined,
      billTo: billTo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    // Store files to upload after transaction is created
    const filesToUpload = [...files];
    
    onSubmit(transaction);

    // Upload files after a short delay to ensure transaction is created
    if (filesToUpload.length > 0 && onUploadAttachment && transaction.id) {
      setUploadingFiles(true);
      try {
        // Wait a bit for transaction to be created on server
        await new Promise((resolve) => setTimeout(resolve, 500));
        await Promise.all(
          filesToUpload.map((file) => onUploadAttachment(transaction.id, file))
        );
        setFiles([]);
      } catch (error) {
        console.error("Failed to upload files", error);
      } finally {
        setUploadingFiles(false);
      }
    }

    if (!editing) {
      setAmount("");
      setDescription("");
      setSender("");
      setBillTo("");
      setNotes("");
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <label className="text-xs text-muted">
        Дата
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          required
        />
      </label>
      <label className="text-xs text-muted">
        Сума (EUR)
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="0.00"
          required
        />
      </label>
      <label className="text-xs text-muted">
        Опис (необов'язково)
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Наприклад: Оплата за проект"
        />
      </label>
      <div className="text-xs text-muted">
        <label className="block mb-2">
          Заповнити з шаблону (необов'язково)
        </label>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          disabled={loadingTemplates}
          className="w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">-- Оберіть шаблон --</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {templates.length === 0 && !loadingTemplates && (
          <p className="mt-1 text-[10px] text-muted/70">
            Немає збережених шаблонів. Створіть їх у меню "Templates"
          </p>
        )}
      </div>
      <label className="text-xs text-muted">
        Відправник / клієнт (необов'язково)
        <input
          type="text"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Компанія або ім'я"
        />
      </label>
      <label className="text-xs text-muted">
        Bill To (необов'язково)
        <textarea
          value={billTo}
          onChange={(e) => setBillTo(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm font-mono shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder={`Company name: UAB "Civitta"
Company code: 302477747
VAT code: LT100005180610
Address: Gedimino pr. 27, LT-01104 Vilnius, Lithuania
Phone: +370 685 26680
Email: info@civitta.com
Bank: Swedbank
IBAN: LT407300010124087168`}
          aria-label="Bill To - інформація про компанію-одержувача рахунку"
        />
      </label>
      <label className="text-xs text-muted">
        Нотатки (необов'язково)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Деталі платежу, спосіб оплати, посилання на інвойс"
          aria-label="Нотатки про транзакцію"
        />
      </label>
      {onUploadAttachment && (
        <div className="text-xs text-muted">
          <label className="block mb-2">Вкладення (необов'язково)</label>
          <div className="space-y-2">
            {editing?.attachments && editing.attachments.length > 0 && (
              <div className="space-y-1 mb-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                  Існуючі файли:
                </div>
                {editing.attachments.map((att) => {
                  const isPdf = att.contentType === "application/pdf";
                  const isImage = att.contentType.startsWith("image/");
                  const fileSize = att.size < 1024
                    ? `${att.size} B`
                    : att.size < 1024 * 1024
                      ? `${(att.size / 1024).toFixed(1)} KB`
                      : `${(att.size / (1024 * 1024)).toFixed(2)} MB`;

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-lg border border-card-border/60 bg-white/80 px-3 py-2 text-xs"
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0 text-foreground no-underline transition hover:text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPdf ? (
                          <span className="text-xs" aria-hidden="true">📄</span>
                        ) : isImage ? (
                          <span className="text-xs" aria-hidden="true">🖼️</span>
                        ) : (
                          <span className="text-xs" aria-hidden="true">📎</span>
                        )}
                        <span className="truncate flex-1">{att.originalName}</span>
                        <span className="text-[10px] text-muted shrink-0">{fileSize}</span>
                      </a>
                      {onDeleteAttachment && editing?.id && (
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(att.id, editing.id)}
                          className="ml-2 rounded px-1.5 py-0.5 text-xs text-muted transition hover:bg-rose-50 hover:text-rose-600 shrink-0"
                          aria-label={`Видалити ${att.originalName}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-card-border/60 bg-white/50 px-3 py-2 text-sm font-medium text-accent transition hover:border-accent/40 hover:bg-accent-wash/30">
              <input
                type="file"
                className="hidden"
                accept="application/pdf,image/*"
                multiple
                onChange={handleFileChange}
                aria-label="Додати файли до транзакції"
              />
              <span className="text-xs">+</span>
              <span>Додати файли</span>
            </label>
            {files.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                  Нові файли:
                </div>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-card-border/60 bg-white/80 px-3 py-2 text-xs"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 rounded px-1.5 py-0.5 text-xs text-muted transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Видалити ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={uploadingFiles}
          className="w-full sm:w-auto rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingFiles ? "Завантаження..." : editing ? "Оновити" : "Додати"}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-full sm:w-auto rounded-xl border border-card-border bg-white/80 px-4 py-2 text-sm font-semibold text-muted shadow-sm transition hover:border-foreground/30 hover:text-foreground"
          >
            Скасувати
          </button>
        ) : null}
      </div>
    </form>
  );
}
