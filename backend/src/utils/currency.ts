export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  EUR: 1.09,
  INR: 0.012,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  BRL: 0.18,
};

export function toUsd(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES_TO_USD[currency] ?? 1;
  return amount * rate;
}