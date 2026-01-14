import { describe, expect, it } from "vitest";
import { createYearData } from "./years";
import type {
  CalculatorInputValues,
  RevenueTransaction,
  TransactionAttachment,
} from "../tax/types";

const baseInputs: CalculatorInputValues = {
  year: "2024",
  revenue: "0",
  coeff: "0.67",
  taxRate: "0.05",
  inpsType: "gestione_separata",
  inpsRate: "0.26",
  inpsDeductible: true,
  applyAcconti: true,
  splitModel: "standard",
  customSplitJune: "0.4",
  customSplitNovember: "0.6",
};

describe("createYearData", () => {
  it("strips attachments from transactions when building year payload", () => {
    const attachments: TransactionAttachment[] = [
      {
        id: "att-1",
        transactionId: "tx-1",
        url: "https://example.com/file.pdf",
        contentType: "application/pdf",
        originalName: "file.pdf",
        size: 1024,
        createdAt: new Date("2024-01-02").toISOString(),
      },
    ];

    const transactions: RevenueTransaction[] = [
      {
        id: "tx-1",
        date: "2024-01-01",
        amount: 100,
        description: "Test",
        sender: "Client",
        notes: "Note",
        attachments,
      },
    ];

    const result = createYearData(2024, baseInputs, baseInputs, transactions);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).not.toHaveProperty("attachments");
    expect(result.transactions[0]).toMatchObject({
      id: "tx-1",
      date: "2024-01-01",
      amount: 100,
      description: "Test",
      sender: "Client",
      notes: "Note",
    });
  });
});
