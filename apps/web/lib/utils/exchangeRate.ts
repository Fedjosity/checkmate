// ─── Exchange Rate Utility (Frontend) ───
// Mirrors backend rates for display purposes only.
// Flutterwave handles actual currency conversion at checkout.

const RATES: Record<string, number> = {
  NGN: 1650,
  GHS: 15.8,
  KES: 129,
  ZAR: 18.5,
  GBP: 0.79,
  EUR: 0.92,
  USD: 1,
};

const COUNTRY_CURRENCY: Record<string, string> = {
  Nigeria: 'NGN',
  Ghana: 'GHS',
  Kenya: 'KES',
  'South Africa': 'ZAR',
  'United Kingdom': 'GBP',
  Other: 'USD',
};

const SYMBOLS: Record<string, string> = {
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  GBP: '£',
  EUR: '€',
  USD: '$',
};

export function getCurrency(country: string): string {
  return COUNTRY_CURRENCY[country] ?? 'USD';
}

export function getSymbol(currency: string): string {
  return SYMBOLS[currency] ?? '$';
}

export function formatBundlePrice(usdAmount: number, country: string): string {
  const currency = getCurrency(country);
  const rate = RATES[currency] ?? 1;
  const symbol = SYMBOLS[currency] ?? '$';
  const localAmount = usdAmount * rate;

  if (currency === 'NGN') {
    return `${symbol}${Math.round(localAmount).toLocaleString('en-NG')}`;
  }
  return `${symbol}${localAmount.toFixed(2)}`;
}

export function formatCrowns(crowns: number): string {
  return crowns.toLocaleString();
}

export function crownsToUSD(crowns: number): string {
  return `$${(crowns / 100).toFixed(2)}`;
}
