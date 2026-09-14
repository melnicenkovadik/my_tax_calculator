export type InpsType = "gestione_separata" | "artigiani_commercianti";

export type CalculatorInputs = {
  year: number;
  revenue: number;
  coeff: number;
  taxRate: number;
  inpsType: InpsType;
  inpsRate: number;
  inpsDeductible: boolean;
  // Advances already paid for this year (from F24). Undefined = derived from the previous year.
  inpsAccontiPaid?: number;
  taxAccontiPaid?: number;
};

export type CalculatorInputValues = {
  year: string;
  revenue: string;
  coeff: string;
  taxRate: string;
  inpsType: InpsType;
  inpsRate: string;
  inpsDeductible: boolean;
  inpsAccontiPaid?: string;
  taxAccontiPaid?: string;
};

export type CalculatorResults = {
  taxableBase: number;
  inps: number;
  inpsDeduction: number;
  baseAfterDeduction: number;
  tax: number;
  totalDue: number;
  effectiveInpsRate: number;
  effectiveTaxRate: number;
  effectiveTotalRate: number;
};

export type ScheduleItem = {
  key: "saldo" | "november";
  dueDate: string;
  amount: number;
  saldo: number;
  acconto: number;
};

export type YearChainEntry = {
  inputs: CalculatorInputs;
  revenue: number;
};

export type YearPlan = {
  year: number;
  totals: CalculatorResults;
  inpsAccontiPaid: number;
  taxAccontiPaid: number;
  inpsPaidInYear: number;
  nextInpsAcconti: number;
  nextTaxAcconti: number;
  payments: ScheduleItem[];
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
