import type {
  CalculatorInputs,
  CalculatorResults,
  YearChainEntry,
  YearPlan,
} from "./types";

const INPS_MAX_BASE_BY_YEAR: Record<number, number> = {
  2024: 120_607,
  2025: 120_607,
  2026: 122_295,
};

// Gestione Separata acconti: 80% of this year's contributions, paid 40% + 40% next year.
export const INPS_ACCONTO_RATE = 0.8;
// Imposta sostitutiva acconto: 100% of this year's tax, 50% + 50% for ISA subjects (forfettari).
const TAX_ACCONTO_MIN = 51.65;
const TAX_FIRST_INSTALLMENT_MIN = 103;

// Proroga of the 30 June deadline for ISA subjects, keyed by payment year.
const SALDO_DEADLINE_OVERRIDES: Record<number, string> = {
  2025: "2025-07-21",
  2026: "2026-07-20",
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

export function resolveGestioneSeparataBase(
  taxableBase: number,
  year: number,
): number {
  const maxBase = INPS_MAX_BASE_BY_YEAR[year];
  if (typeof maxBase !== "number") return taxableBase;
  return Math.min(taxableBase, maxBase);
}

export function computeTax(base: number, taxRate: number): number {
  return base * taxRate;
}

export function computeTotals(
  inputs: CalculatorInputs,
  inpsPaidInYear: number,
): CalculatorResults {
  const taxableBase = computeTaxableBase(inputs.revenue, inputs.coeff);
  const inpsBase =
    inputs.inpsType === "gestione_separata"
      ? resolveGestioneSeparataBase(taxableBase, inputs.year)
      : 0;
  const inps =
    inputs.inpsType === "gestione_separata"
      ? computeInpsGestioneSeparata(inpsBase, inputs.inpsRate)
      : 0;
  // WHY: forfettari deduct INPS actually paid during the calendar year (cash basis),
  // not the contributions accrued on this year's income. Excess is lost, not carried forward.
  const inpsDeduction = inputs.inpsDeductible
    ? Math.min(Math.max(inpsPaidInYear, 0), taxableBase)
    : 0;
  const baseAfterDeduction = taxableBase - inpsDeduction;
  const tax = computeTax(baseAfterDeduction, inputs.taxRate);
  const totalDue = inps + tax;
  const revenueSafe = inputs.revenue > 0 ? inputs.revenue : 0;
  const effectiveInpsRate = revenueSafe ? inps / revenueSafe : 0;
  const effectiveTaxRate = revenueSafe ? tax / revenueSafe : 0;
  const effectiveTotalRate = revenueSafe ? totalDue / revenueSafe : 0;

  return {
    taxableBase,
    inps,
    inpsDeduction,
    baseAfterDeduction,
    tax,
    totalDue,
    effectiveInpsRate,
    effectiveTaxRate,
    effectiveTotalRate,
  };
}

const toDeadline = (year: number, monthIndex: number, day: number): string => {
  const date = new Date(Date.UTC(year, monthIndex, day));
  const weekday = date.getUTCDay();
  if (weekday === 6) date.setUTCDate(date.getUTCDate() + 2);
  if (weekday === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

export function computeDeadlines(taxYear: number): { saldo: string; november: string } {
  const payYear = taxYear + 1;
  return {
    saldo: SALDO_DEADLINE_OVERRIDES[payYear] ?? toDeadline(payYear, 5, 30),
    november: toDeadline(payYear, 10, 30),
  };
}

export type DeadlineTone = "past" | "urgent" | "soon" | "ok";

const URGENT_DAYS = 14;
const SOON_DAYS = 45;

export function daysUntil(dueDate: string, today: string): number {
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(dueDate) - toUtc(today)) / 86_400_000);
}

export function deadlineTone(days: number): DeadlineTone {
  if (days < 0) return "past";
  if (days <= URGENT_DAYS) return "urgent";
  if (days <= SOON_DAYS) return "soon";
  return "ok";
}

// Each year's saldo depends on the acconti paid during that year, which were set by the
// previous year's result, so years are computed as a chain in ascending order.
export function computeYearPlans(entries: YearChainEntry[]): YearPlan[] {
  const plans: YearPlan[] = [];
  const sorted = [...entries].sort((a, b) => a.inputs.year - b.inputs.year);

  for (const { inputs, revenue } of sorted) {
    const prev = plans.find((plan) => plan.year === inputs.year - 1);
    const inpsAccontiPaid = inputs.inpsAccontiPaid ?? prev?.nextInpsAcconti ?? 0;
    const taxAccontiPaid = inputs.taxAccontiPaid ?? prev?.nextTaxAcconti ?? 0;
    const prevInpsSaldo = prev ? prev.totals.inps - prev.inpsAccontiPaid : 0;
    const inpsPaidInYear = Math.max(prevInpsSaldo + inpsAccontiPaid, 0);
    const totals = computeTotals({ ...inputs, revenue }, inpsPaidInYear);

    const saldo = totals.inps - inpsAccontiPaid + (totals.tax - taxAccontiPaid);
    const nextInpsAcconti = totals.inps * INPS_ACCONTO_RATE;
    const nextTaxAcconti = totals.tax > TAX_ACCONTO_MIN ? totals.tax : 0;
    const taxFirstHalf =
      nextTaxAcconti / 2 > TAX_FIRST_INSTALLMENT_MIN ? nextTaxAcconti / 2 : 0;
    const summerAcconto = nextInpsAcconti / 2 + taxFirstHalf;
    const novemberAcconto = nextInpsAcconti / 2 + nextTaxAcconti - taxFirstHalf;
    const summer = saldo + summerAcconto;
    // WHY: an overpaid saldo is a credit offset in F24 against the next amounts due.
    const november = novemberAcconto + Math.min(summer, 0);
    const deadlines = computeDeadlines(inputs.year);

    plans.push({
      year: inputs.year,
      totals,
      inpsAccontiPaid,
      taxAccontiPaid,
      inpsPaidInYear,
      nextInpsAcconti,
      nextTaxAcconti,
      payments: [
        {
          key: "saldo",
          dueDate: deadlines.saldo,
          amount: Math.max(summer, 0),
          saldo,
          acconto: summerAcconto,
        },
        {
          key: "november",
          dueDate: deadlines.november,
          amount: Math.max(november, 0),
          saldo: 0,
          acconto: novemberAcconto,
        },
      ],
    });
  }

  return plans;
}
