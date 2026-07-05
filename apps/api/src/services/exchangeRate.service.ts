// ─── Exchange Rate Service ───
// Provides approximate local currency rates for display purposes only.
// Flutterwave handles the actual conversion at payment time.

// TODO: Replace FALLBACK_RATES with a live exchange rate API call
// (e.g. ExchangeRate-API or Flutterwave rates endpoint) on a 1-hour
// cache. Hardcoded rates are accurate for MVP but will drift over time.

const FALLBACK_RATES: Record<string, number> = {
  NGN: 1650,
  GHS: 15.8,
  KES: 129,
  ZAR: 18.5,
  GBP: 0.79,
  EUR: 0.92,
  USD: 1,
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  Nigeria: 'NGN',
  Ghana: 'GHS',
  Kenya: 'KES',
  'South Africa': 'ZAR',
  'United Kingdom': 'GBP',
  Other: 'USD',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  GBP: '£',
  EUR: '€',
  USD: '$',
};

export function getCurrencyForCountry(country: string): string {
  return COUNTRY_TO_CURRENCY[country] ?? 'USD';
}

export function getSymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? '$';
}

export function convertUSDToLocal(usdAmount: number, currency: string): number {
  const rate = FALLBACK_RATES[currency] ?? 1;
  return usdAmount * rate;
}

export function formatLocalAmount(usdAmount: number, currency: string): string {
  const symbol = getSymbol(currency);
  const localAmount = convertUSDToLocal(usdAmount, currency);

  if (currency === 'NGN') {
    return `${symbol}${Math.round(localAmount).toLocaleString('en-NG')}`;
  }
  return `${symbol}${localAmount.toFixed(2)}`;
}
