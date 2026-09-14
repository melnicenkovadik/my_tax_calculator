import { describe, expect, it } from "vitest";
import {
  computeDeadlines,
  daysUntil,
  deadlineTone,
  computeInpsGestioneSeparata,
  computeTotals,
  computeYearPlans,
  resolveGestioneSeparataBase,
} from "./calculations";
import type { CalculatorInputs, YearChainEntry } from "./types";

const baseInputs: CalculatorInputs = {
  year: 2024,
  revenue: 0,
  coeff: 0.67,
  taxRate: 0.05,
  inpsType: "gestione_separata",
  inpsRate: 0.2607,
  inpsDeductible: true,
};

const entry = (
  year: number,
  revenue: number,
  overrides: Partial<CalculatorInputs> = {},
): YearChainEntry => ({
  inputs: { ...baseInputs, ...overrides, year },
  revenue,
});

describe("computeTotals", () => {
  it("deducts INPS paid in the year, not the accrued contributions", () => {
    const totals = computeTotals(
      { ...baseInputs, revenue: 11552.62, inpsRate: 0.26 },
      1000,
    );

    expect(totals.taxableBase).toBeCloseTo(7740.26, 2);
    expect(totals.inps).toBeCloseTo(2012.47, 2);
    expect(totals.inpsDeduction).toBe(1000);
    expect(totals.baseAfterDeduction).toBeCloseTo(6740.26, 2);
    expect(totals.tax).toBeCloseTo(337.01, 2);
  });

  it("caps the deduction at the taxable base and respects the toggle", () => {
    const capped = computeTotals({ ...baseInputs, revenue: 1000 }, 5000);
    expect(capped.baseAfterDeduction).toBe(0);
    expect(capped.tax).toBe(0);

    const off = computeTotals(
      { ...baseInputs, revenue: 1000, inpsDeductible: false },
      5000,
    );
    expect(off.inpsDeduction).toBe(0);
    expect(off.tax).toBeCloseTo(33.5, 2);
  });

  it("caps gestione separata base for 2024/2025", () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      revenue: 200000,
      coeff: 1,
      taxRate: 0.15,
    };

    const cappedBase = resolveGestioneSeparataBase(200000, inputs.year);
    expect(cappedBase).toBe(120607);
    expect(computeInpsGestioneSeparata(cappedBase, 0.2607)).toBeCloseTo(31442.24, 2);
    expect(computeTotals(inputs, 0).inps).toBeCloseTo(31442.24, 2);
  });
});

describe("computeDeadlines", () => {
  it("uses proroga dates where known and moves weekend deadlines to Monday", () => {
    expect(computeDeadlines(2024)).toEqual({ saldo: "2025-07-21", november: "2025-12-01" });
    expect(computeDeadlines(2025)).toEqual({ saldo: "2026-07-20", november: "2026-11-30" });
    expect(computeDeadlines(2026)).toEqual({ saldo: "2027-06-30", november: "2027-11-30" });
    expect(computeDeadlines(2023).saldo).toBe("2024-07-01");
  });
});

describe("days until deadline", () => {
  it("counts calendar days across DST and year boundaries", () => {
    expect(daysUntil("2027-06-30", "2026-09-14")).toBe(289);
    expect(daysUntil("2026-10-26", "2026-10-24")).toBe(2);
    expect(daysUntil("2026-09-14", "2026-09-14")).toBe(0);
    expect(daysUntil("2026-07-20", "2026-09-14")).toBe(-56);
  });

  it("colours by urgency", () => {
    expect(deadlineTone(-1)).toBe("past");
    expect(deadlineTone(0)).toBe("urgent");
    expect(deadlineTone(14)).toBe("urgent");
    expect(deadlineTone(15)).toBe("soon");
    expect(deadlineTone(45)).toBe("soon");
    expect(deadlineTone(46)).toBe("ok");
  });
});

describe("computeYearPlans", () => {
  const [plan2024, plan2025, plan2026] = computeYearPlans([
    entry(2026, 23308.99),
    entry(2024, 11840.52),
    entry(2025, 11398.78),
  ]);

  it("first year: no acconti paid, next year's acconti split 40/40 INPS and 50/50 tax", () => {
    expect(plan2024.year).toBe(2024);
    expect(plan2024.inpsAccontiPaid).toBe(0);
    expect(plan2024.totals.inps).toBeCloseTo(2068.17, 2);
    expect(plan2024.totals.tax).toBeCloseTo(396.66, 2);
    expect(plan2024.payments[0]).toMatchObject({ key: "saldo", dueDate: "2025-07-21" });
    expect(plan2024.payments[0].amount).toBeCloseTo(3490.43, 2);
    expect(plan2024.payments[1].amount).toBeCloseTo(1025.6, 2);
  });

  it("stays within 3% of the commercialista's real 2025 bill (3432,50 + 1000,73)", () => {
    const total = plan2024.payments[0].amount + plan2024.payments[1].amount;
    expect(Math.abs(total - 4433.23) / 4433.23).toBeLessThan(0.03);
  });

  it("chains acconti and cash-basis INPS deduction into the following years", () => {
    expect(plan2025.inpsAccontiPaid).toBeCloseTo(1654.54, 2);
    expect(plan2025.taxAccontiPaid).toBeCloseTo(396.66, 2);
    expect(plan2025.inpsPaidInYear).toBeCloseTo(3722.71, 2);
    expect(plan2025.payments[0].amount).toBeCloseTo(931.95, 2);
    // tax acconto 195,72: first half <= 103, so it all goes to November
    expect(plan2025.payments[1].amount).toBeCloseTo(992.13, 2);

    expect(plan2026.inpsPaidInYear).toBeCloseTo(1929.29, 2);
    expect(plan2026.payments[0]).toMatchObject({ dueDate: "2027-06-30" });
    expect(plan2026.payments[0].amount).toBeCloseTo(4937.95, 2);
    expect(plan2026.payments[1].amount).toBeCloseTo(1970.74, 2);
  });

  it("uses acconti entered from F24 instead of the derived ones", () => {
    const [plan] = computeYearPlans([
      entry(2026, 23308.99, { inpsAccontiPaid: 1336, taxAccontiPaid: 100 }),
    ]);
    expect(plan.inpsPaidInYear).toBe(1336);
    expect(plan.payments[0].amount).toBeCloseTo(5334.98, 2);
    expect(plan.payments[1].amount).toBeCloseTo(1985.57, 2);
  });

  it("offsets an overpaid saldo against the November acconto", () => {
    const [plan] = computeYearPlans([
      entry(2030, 20000, { inpsAccontiPaid: 6000, taxAccontiPaid: 0 }),
    ]);
    expect(plan.payments[0].saldo).toBeCloseTo(-2136.62, 2);
    expect(plan.payments[0].amount).toBe(0);
    expect(plan.payments[1]).toMatchObject({ dueDate: "2031-12-01" });
    expect(plan.payments[1].amount).toBeCloseTo(1028.08, 2);
  });

  it("skips the tax acconto below 51,65 and never returns negative payments", () => {
    const [, plan] = computeYearPlans([entry(2024, 11840.52), entry(2025, 1000)]);
    expect(plan.nextTaxAcconti).toBe(0);
    expect(plan.payments[0].amount).toBe(0);
    expect(plan.payments[1].amount).toBe(0);
  });
});
