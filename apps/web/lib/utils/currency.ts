export function centsToUSD(cents: number): number {
  return cents / 100;
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// TODO: V2 — add proper currency localisation (NGN, GBP, etc.)
export function formatBalance(cents: number, currency = 'USD'): string {
  if (currency === 'NGN') {
    const naira = (cents / 100) * 1650;
    return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}
