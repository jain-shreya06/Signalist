export type WatchlistInput = {
  symbol: string;
  company: string;
};

export function normalizeStockSymbol(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const symbol = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(symbol) ? symbol : null;
}

export function validateWatchlistInput(value: unknown): WatchlistInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const symbol = normalizeStockSymbol(record.symbol);
  if (!symbol || typeof record.company !== "string") return null;

  const company = record.company.trim();
  if (company.length < 1 || company.length > 120 || /[\u0000-\u001f\u007f]/.test(company)) return null;
  return { symbol, company };
}
