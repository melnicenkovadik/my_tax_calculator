import { describe, expect, it } from "vitest";
import { calculatorInputValuesSchema, parseCalculatorInputs } from "./validation";

// Shape stored in the DB before the payment-plan rework (split model, no paid acconti).
const legacyStored = {
  year: "2026",
  revenue: "0",
  coeff: "0.67",
  taxRate: "0.05",
  inpsType: "gestione_separata",
  inpsRate: "0.26",
  inpsDeductible: false,
  applyAcconti: false,
  splitModel: "custom",
  customSplitJune: "0.4",
  customSplitNovember: "0.6",
};

describe("calculator inputs validation", () => {
  it("parses legacy stored inputs and leaves paid acconti undefined", () => {
    const values = calculatorInputValuesSchema.parse(legacyStored);
    const { parsed, errors } = parseCalculatorInputs(values);

    expect(errors).toEqual({});
    expect(parsed).toMatchObject({ year: 2026, inpsRate: 0.26, inpsDeductible: false });
    expect(parsed?.inpsAccontiPaid).toBeUndefined();
    expect(parsed).not.toHaveProperty("splitModel");
  });

  it("treats an empty field as auto and rejects negative amounts", () => {
    const values = calculatorInputValuesSchema.parse(legacyStored);

    expect(parseCalculatorInputs({ ...values, inpsAccontiPaid: "" }).parsed?.inpsAccontiPaid).toBeUndefined();
    expect(parseCalculatorInputs({ ...values, taxAccontiPaid: "100.5" }).parsed?.taxAccontiPaid).toBe(100.5);
    expect(parseCalculatorInputs({ ...values, inpsAccontiPaid: "-1" }).errors).toHaveProperty("inpsAccontiPaid");
  });
});
