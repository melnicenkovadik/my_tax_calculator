import type { TransactionTemplate } from "@/lib/tax/types";

const API_BASE = "/api/templates";

export async function fetchTemplates(): Promise<TransactionTemplate[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    throw new Error("Failed to fetch templates");
  }
  return res.json();
}

export async function createTemplate(
  name: string,
  sender?: string,
  billTo?: string,
  notes?: string
): Promise<TransactionTemplate | null> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sender, billTo, notes }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create template");
    }

    return res.json();
  } catch (error) {
    console.error("Failed to create template", error);
    return null;
  }
}

export async function updateTemplate(
  id: string,
  name: string,
  sender?: string,
  billTo?: string,
  notes?: string
): Promise<TransactionTemplate | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sender, billTo, notes }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update template");
    }

    return res.json();
  } catch (error) {
    console.error("Failed to update template", error);
    return null;
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete template");
    }

    return true;
  } catch (error) {
    console.error("Failed to delete template", error);
    return false;
  }
}
