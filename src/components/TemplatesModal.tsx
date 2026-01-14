"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/lib/storage/templates";
import type { TransactionTemplate } from "@/lib/tax/types";

type TemplatesModalProps = {
  onClose: () => void;
  onSelectTemplate: (template: TransactionTemplate) => void;
};

export function TemplatesModal({ onClose, onSelectTemplate }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sender: "",
    billTo: "",
    notes: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", sender: "", billTo: "", notes: "" });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (template: TransactionTemplate) => {
    setFormData({
      name: template.name,
      sender: template.sender ?? "",
      billTo: template.billTo ?? "",
      notes: template.notes ?? "",
    });
    setEditingId(template.id);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        const updated = await updateTemplate(
          editingId,
          formData.name.trim(),
          formData.sender.trim() || undefined,
          formData.billTo.trim() || undefined,
          formData.notes.trim() || undefined
        );
        if (updated) {
          await loadTemplates();
          resetForm();
        }
      } else {
        const created = await createTemplate(
          formData.name.trim(),
          formData.sender.trim() || undefined,
          formData.billTo.trim() || undefined,
          formData.notes.trim() || undefined
        );
        if (created) {
          await loadTemplates();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to save template", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити цей шаблон?")) return;
    const success = await deleteTemplate(id);
    if (success) {
      await loadTemplates();
      if (editingId === id) {
        resetForm();
      }
    }
  };

  const handleSelect = (template: TransactionTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-card-border bg-card/95 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-card-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Шаблони транзакцій
            </p>
            <h2 className="mt-1 font-display text-2xl text-foreground">
              Управління шаблонами
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-white/20 hover:text-foreground"
            aria-label="Закрити"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {editingId ? "Редагувати шаблон" : isCreating ? "Створити шаблон" : "Новий шаблон"}
                </h3>
                {!isCreating && !editingId && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="rounded-full border border-card-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
                  >
                    + Створити
                  </button>
                )}
              </div>

              {(isCreating || editingId) && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block text-xs text-muted">
                    Назва шаблону *
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Наприклад: Civitta"
                      required
                      autoFocus
                    />
                  </label>

                  <label className="block text-xs text-muted">
                    Відправник / клієнт
                    <input
                      type="text"
                      value={formData.sender}
                      onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Компанія або ім'я"
                    />
                  </label>

                  <label className="block text-xs text-muted">
                    Bill To
                    <textarea
                      value={formData.billTo}
                      onChange={(e) => setFormData({ ...formData, billTo: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm font-mono shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Company name, address, etc."
                    />
                  </label>

                  <label className="block text-xs text-muted">
                    Нотатки
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-card-border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Додаткові нотатки"
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
                    >
                      {editingId ? "Оновити" : "Створити"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-card-border bg-white/80 px-4 py-2 text-sm font-semibold text-muted shadow-sm transition hover:border-foreground/30 hover:text-foreground"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Templates List Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Збережені шаблони ({templates.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-sm text-muted">
                  Завантаження...
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-xl border border-card-border bg-white/50 p-8 text-center text-sm text-muted">
                  Немає збережених шаблонів
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="group rounded-xl border border-card-border bg-white/80 p-4 transition hover:border-accent/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {template.name}
                          </h4>
                          <div className="mt-2 space-y-1 text-xs text-muted">
                            {template.sender && (
                              <div className="truncate">
                                <span className="font-medium">Відправник:</span> {template.sender}
                              </div>
                            )}
                            {template.billTo && (
                              <div className="line-clamp-2 font-mono">
                                <span className="font-medium">Bill To:</span> {template.billTo}
                              </div>
                            )}
                            {template.notes && (
                              <div className="line-clamp-1">
                                <span className="font-medium">Нотатки:</span> {template.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelect(template)}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-strong"
                            title="Використати шаблон"
                          >
                            Використати
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(template)}
                            className="rounded-lg border border-card-border bg-white/80 px-2 py-1.5 text-xs text-muted transition hover:border-foreground/30 hover:text-foreground"
                            title="Редагувати"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(template.id)}
                            className="rounded-lg border border-card-border bg-white/80 px-2 py-1.5 text-xs text-muted transition hover:border-rose-400 hover:text-rose-600"
                            title="Видалити"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
