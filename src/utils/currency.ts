/**
 * Format a monetary amount for display.
 * Mirrors the original src/lib/currency.ts logic.
 */
export function formatCurrency(amount: number, currency = 'AUD'): string {
  const absAmount = Math.abs(amount);
  let formatted: string;

  switch (currency.toUpperCase()) {
    case 'INR':
      formatted = `₹${absAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
      break;
    case 'USD':
      formatted = `$${absAmount.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
      break;
    case 'AUD':
    default:
      formatted = `A$${absAmount.toLocaleString('en-AU', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
      break;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/** Format a P&L percentage with sign and 2 decimal places. */
export function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/** Format a stock price (up to 4 decimal places for small-cap). */
export function formatPrice(price: number, currency = 'AUD'): string {
  if (price < 1) return formatCurrency(price, currency).replace(/(\.\d{2})\d*/, '$1');
  return formatCurrency(price, currency);
}

/** Returns a currency symbol. */
export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'USD': return '$';
    case 'INR': return '₹';
    case 'AUD': return 'A$';
    default: return currency;
  }
}

/** Supported currencies for new portfolio creation. */
export const SUPPORTED_CURRENCIES = [
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
] as const;
