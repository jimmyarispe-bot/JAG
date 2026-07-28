/**
 * Currency registry — multi-currency ready foundation.
 */

export const SUPPORTED_CURRENCIES = Object.freeze([
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "MXN",
] as const);

export function listCurrencies(): readonly string[] {
  return SUPPORTED_CURRENCIES;
}

export function isSupportedCurrency(code: string): boolean {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(
    code.toUpperCase()
  );
}
