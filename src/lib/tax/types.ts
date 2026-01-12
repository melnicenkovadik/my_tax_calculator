export type InpsType = "gestione_separata" | "artigiani_commercianti";

export type SplitModel = "standard" | "custom";

export type CalculatorInputs = {
  year: number;
  revenue: number;
  coeff: number;
  taxRate: number;
  inpsType: InpsType;
  inpsRate: number;
  inpsDeductible: boolean;
  applyAcconti: boolean;
  splitModel: SplitModel;
  customSplitJune: number;
  customSplitNovember: number;
};

export type CalculatorInputValues = {
  year: string;
  revenue: string;
  coeff: string;
  taxRate: string;
  inpsType: InpsType;
  inpsRate: string;
  inpsDeductible: boolean;
  applyAcconti: boolean;
  splitModel: SplitModel;
  customSplitJune: string;
  customSplitNovember: string;
};

export type CalculatorResults = {
  taxableBase: number;
  inps: number;
  baseAfterDeduction: number;
  tax: number;
  totalDue: number;
  effectiveInpsRate: number;
  effectiveTaxRate: number;
  effectiveTotalRate: number;
};

export type ScheduleSplit = {
  june: number;
  november: number;
  model: SplitModel;
};

export type ScheduleItem = {
  key: "june" | "november";
  amount: number;
  saldo: number;
  acconto: number;
};

export type RevenueTransaction = {
  id: string;
  date: string; // YYYY-MM-DD format
  amount: number;
  description?: string;
};

export type YearData = {
  year: number;
  inputs: CalculatorInputValues;
  defaults: CalculatorInputValues;
  transactions: RevenueTransaction[];
  lastUpdated: string;
};

export type YearsData = {
  [year: string]: YearData;
};
