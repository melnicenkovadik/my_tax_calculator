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

export function computeTaxableBase(revenue: number, coeff: number): number {
  return revenue * coeff;
}

export function computeInpsGestioneSeparata(
  taxableBase: number,
  inpsRate: number,
): number {
  return taxableBase * inpsRate;
}

export function computeTax(base: number, taxRate: number): number {
  return base * taxRate;
}

export function computeTotals(inputs: CalculatorInputs): CalculatorResults {
  const taxableBase = computeTaxableBase(inputs.revenue, inputs.coeff);
  const inps =
    inputs.inpsType === "gestione_separata"
      ? computeInpsGestioneSeparata(taxableBase, inputs.inpsRate)
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
  totalDue: number,
  accontoEnabled: boolean,
  split: ScheduleSplit,
): ScheduleItem[] {
  const saldo = totalDue;

  if (!accontoEnabled) {
    return [{ key: "june", amount: saldo, saldo, acconto: 0 }];
  }

  const accontoJune = totalDue * split.june;
  const accontoNovember = totalDue * split.november;

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
