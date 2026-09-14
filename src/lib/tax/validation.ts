import { z } from "zod";
import type { CalculatorInputs, CalculatorInputValues } from "./types";

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const numberField = (
  label: string,
  options: { min?: number; max?: number } = {},
) => {
  let base = z.number().finite(`${label} має бути числом`);

  if (typeof options.min === "number") {
    base = base.min(options.min, `${label} має бути >= ${options.min}`);
  }

  if (typeof options.max === "number") {
    base = base.max(options.max, `${label} має бути <= ${options.max}`);
  }

  return z.preprocess(toNumber, base);
};

const optionalAmountField = (label: string) =>
  z.preprocess(toNumber, z.number().min(0, `${label} має бути >= 0`).optional());

export const calculatorInputsSchema = z.object({
  year: numberField("Податковий рік", { min: 1900, max: 2100 }).refine(
    (value) => Number.isInteger(value),
    "Податковий рік має бути цілим числом!",
  ),
  revenue: numberField("Дохід", { min: 0 }),
  coeff: numberField("Коефіцієнт", { min: 0, max: 1 }),
  taxRate: numberField("Податкова ставка", { min: 0, max: 1 }).refine(
    (value) => value === 0.05 || value === 0.15,
    "Податкова ставка має бути 0.05 або 0.15",
  ),
  inpsType: z.enum(["gestione_separata", "artigiani_commercianti"]),
  inpsRate: numberField("Ставка INPS", { min: 0, max: 1 }),
  inpsDeductible: z.boolean(),
  inpsAccontiPaid: optionalAmountField("Сплачені аванси INPS"),
  taxAccontiPaid: optionalAmountField("Сплачені аванси податку"),
});

const toString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return "";
};

export const calculatorInputValuesSchema: z.ZodType<CalculatorInputValues> =
  z.object({
    year: z.preprocess(toString, z.string()),
    revenue: z.preprocess(toString, z.string()),
    coeff: z.preprocess(toString, z.string()),
    taxRate: z.preprocess(toString, z.string()),
    inpsType: z.enum(["gestione_separata", "artigiani_commercianti"]),
    inpsRate: z.preprocess(toString, z.string()),
    inpsDeductible: z.boolean(),
    inpsAccontiPaid: z.preprocess(toString, z.string()).optional(),
    taxAccontiPaid: z.preprocess(toString, z.string()).optional(),
  });

export const parseCalculatorInputs = (
  values: CalculatorInputValues,
): { parsed: CalculatorInputs | null; errors: Record<string, string> } => {
  const result = calculatorInputsSchema.safeParse(values);
  if (result.success) {
    return { parsed: result.data, errors: {} };
  }

  const flattened = result.error.flatten().fieldErrors;
  const errors = Object.fromEntries(
    Object.entries(flattened)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([field, messages]) => [field, messages?.[0] ?? "Невірно"]),
  );

  return { parsed: null, errors };
};
