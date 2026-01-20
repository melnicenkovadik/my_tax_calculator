import type {
  CalculatorInputs,
  CalculatorResults,
  ScheduleItem,
  ScheduleSplit,
} from "./types";

export const DEFAULT_SPLIT: ScheduleSplit = {
  june: 0.4,
  november: 0.6,
  model: "standard",
};

const INPS_MAX_BASE_BY_YEAR: Record<number, number> = {
  2024: 120_607,
  2025: 120_607,
};

export const DEFAULT_INPS_ACCONTO_RATE = 0.8;
export const DEFAULT_TAX_ACCONTO_RATE = 1;

export function computeTaxableBase(revenue: number, coeff: number): number {
  return revenue * coeff;
}

export function computeInpsGestioneSeparata(
  taxableBase: number,
  inpsRate: number,
): number {
  return taxableBase * inpsRate;
}

export function resolveGestioneSeparataBase(
  taxableBase: number,
  year: number,
): number {
  const maxBase = INPS_MAX_BASE_BY_YEAR[year];
  if (typeof maxBase !== "number") return taxableBase;
  return Math.min(taxableBase, maxBase);
}

export function computeAccontoBase(
  inps: number,
  tax: number,
  inpsAccontoRate = DEFAULT_INPS_ACCONTO_RATE,
  taxAccontoRate = DEFAULT_TAX_ACCONTO_RATE,
): number {
  return inps * inpsAccontoRate + tax * taxAccontoRate;
}

export function computeTax(base: number, taxRate: number): number {
  return base * taxRate;
}

export function computeTotals(inputs: CalculatorInputs): CalculatorResults {
  const taxableBase = computeTaxableBase(inputs.revenue, inputs.coeff);
  const inpsBase =
    inputs.inpsType === "gestione_separata"
      ? resolveGestioneSeparataBase(taxableBase, inputs.year)
      : 0;
  const inps =
    inputs.inpsType === "gestione_separata"
      ? computeInpsGestioneSeparata(inpsBase, inputs.inpsRate)
      : 0;
  const baseAfterDeduction = inputs.inpsDeductible
    ? Math.max(taxableBase - inps, 0)
    : taxableBase;
  const tax = computeTax(baseAfterDeduction, inputs.taxRate);
  const totalDue = inps + tax;
  const revenueSafe = inputs.revenue > 0 ? inputs.revenue : 0;
  const effectiveInpsRate = revenueSafe ? inps / revenueSafe : 0;
  const effectiveTaxRate = revenueSafe ? tax / revenueSafe : 0;
  const effectiveTotalRate = revenueSafe ? totalDue / revenueSafe : 0;

  return {
    taxableBase,
    inps,
    baseAfterDeduction,
    tax,
    totalDue,
    effectiveInpsRate,
    effectiveTaxRate,
    effectiveTotalRate,
  };
}

export function resolveScheduleSplit(inputs: CalculatorInputs): ScheduleSplit {
  if (inputs.splitModel === "custom") {
    return {
      june: inputs.customSplitJune,
      november: inputs.customSplitNovember,
      model: "custom",
    };
  }

  return DEFAULT_SPLIT;
}

export function computeSchedule(
  saldo: number,
  accontoBase: number,
  accontoEnabled: boolean,
  split: ScheduleSplit,
): ScheduleItem[] {
  if (!accontoEnabled) {
    return [{ key: "june", amount: saldo, saldo, acconto: 0 }];
  }

  const accontoJune = accontoBase * split.june;
  const accontoNovember = accontoBase * split.november;

  return [
    {
      key: "june",
      amount: saldo + accontoJune,
      saldo,
      acconto: accontoJune,
    },
    {
      key: "november",
      amount: accontoNovember,
      saldo: 0,
      acconto: accontoNovember,
    },
  ];
}
