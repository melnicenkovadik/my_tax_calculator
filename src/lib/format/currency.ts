export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
