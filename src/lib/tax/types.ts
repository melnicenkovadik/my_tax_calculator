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
  date: string;
  amount: number;
  description?: string;
  sender?: string;
  billTo?: string;
  notes?: string;
  causale?: string;
  attachments?: TransactionAttachment[];
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

export type TransactionAttachment = {
  id: string;
  transactionId: string;
  url: string;
  contentType: string;
  originalName: string;
  size: number;
  createdAt: string;
};

export type TransactionTemplate = {
  id: string;
  name: string;
  sender?: string;
  billTo?: string;
  notes?: string;
  createdAt: string;
};
