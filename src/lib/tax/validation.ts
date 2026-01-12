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
  let base = z
    .number({
      required_error: `${label} обов'язкове`,
      invalid_type_error: `${label} має бути числом`,
    })
    .finite(`${label} має бути числом`);

  if (typeof options.min === "number") {
    base = base.min(options.min, `${label} має бути >= ${options.min}`);
  }

  if (typeof options.max === "number") {
    base = base.max(options.max, `${label} має бути <= ${options.max}`);
  }

  return z.preprocess(toNumber, base);
};

const baseInputsSchema = z.object({
  year: numberField("Податковий рік", { min: 1900, max: 2100 }).refine(
    (value) => Number.isInteger(value),
    "Податковий рік має бути цілим числом",
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
  applyAcconti: z.boolean(),
});

const standardSplitSchema = baseInputsSchema.extend({
  splitModel: z.literal("standard"),
  customSplitJune: numberField("Розподіл за червень", { min: 0, max: 1 })
    .optional()
    .default(0.4),
  customSplitNovember: numberField("Розподіл за листопад", { min: 0, max: 1 })
    .optional()
    .default(0.6),
});

const customSplitSchema = baseInputsSchema
  .extend({
    splitModel: z.literal("custom"),
    customSplitJune: numberField("Розподіл за червень", { min: 0, max: 1 }),
    customSplitNovember: numberField("Розподіл за листопад", { min: 0, max: 1 }),
  })
  .superRefine((data, ctx) => {
    const sum = data.customSplitJune + data.customSplitNovember;
    if (!Number.isFinite(sum) || Math.abs(sum - 1) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customSplitJune"],
        message: "Розподіл має дорівнювати 1.00",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customSplitNovember"],
        message: "Розподіл має дорівнювати 1.00",
      });
    }
  });

export const calculatorInputsSchema = z.discriminatedUnion("splitModel", [
  standardSplitSchema,
  customSplitSchema,
]);

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
    applyAcconti: z.boolean(),
    splitModel: z.enum(["standard", "custom"]),
    customSplitJune: z.preprocess(toString, z.string()),
    customSplitNovember: z.preprocess(toString, z.string()),
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
