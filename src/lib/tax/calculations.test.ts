import { describe, expect, it } from "vitest";
import {
  computeAccontoBase,
  computeInpsGestioneSeparata,
  computeTax,
  computeTaxableBase,
  computeTotals,
  resolveGestioneSeparataBase,
} from "./calculations";
import type { CalculatorInputs } from "./types";

describe("tax calculations", () => {
  it("computes core totals with expected precision", () => {
    const inputs: CalculatorInputs = {
      year: 2024,
      revenue: 11552.62,
      coeff: 0.67,
      taxRate: 0.05,
      inpsType: "gestione_separata",
      inpsRate: 0.26,
      inpsDeductible: true,
      applyAcconti: true,
      splitModel: "standard",
      customSplitJune: 0.4,
      customSplitNovember: 0.6,
    };

    const taxableBase = computeTaxableBase(inputs.revenue, inputs.coeff);
    const inps = computeInpsGestioneSeparata(taxableBase, inputs.inpsRate);
    const baseAfterDeduction = taxableBase - inps;
    const tax = computeTax(baseAfterDeduction, inputs.taxRate);
    const totals = computeTotals(inputs);

    expect(taxableBase).toBeCloseTo(7740.26, 2);
    expect(inps).toBeCloseTo(2012.47, 2);
    expect(baseAfterDeduction).toBeCloseTo(5727.79, 2);
    expect(tax).toBeCloseTo(286.39, 2);
    expect(totals.totalDue).toBeCloseTo(2298.86, 2);
  });

  it("caps gestione separata base for 2024/2025", () => {
    const inputs: CalculatorInputs = {
      year: 2024,
      revenue: 200000,
      coeff: 1,
      taxRate: 0.15,
      inpsType: "gestione_separata",
      inpsRate: 0.2607,
      inpsDeductible: true,
      applyAcconti: true,
      splitModel: "standard",
      customSplitJune: 0.4,
      customSplitNovember: 0.6,
    };

    const taxableBase = computeTaxableBase(inputs.revenue, inputs.coeff);
    const cappedBase = resolveGestioneSeparataBase(taxableBase, inputs.year);
    const inps = computeInpsGestioneSeparata(cappedBase, inputs.inpsRate);
    const totals = computeTotals(inputs);

    expect(cappedBase).toBe(120607);
    expect(inps).toBeCloseTo(31442.24, 2);
    expect(totals.inps).toBeCloseTo(31442.24, 2);
  });

  it("computes acconto base with different rates", () => {
    const accontoBase = computeAccontoBase(1000, 500);
    expect(accontoBase).toBe(1300);
  });
});
