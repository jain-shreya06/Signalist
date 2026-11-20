import { normalizeStockSymbol, validateWatchlistInput, type WatchlistInput } from "./validation";

export type WatchlistEntry = WatchlistInput & {
  addedAt: Date;
};

export interface WatchlistRepository {
  listForUser(userId: string): Promise<WatchlistEntry[]>;
  addForUser(userId: string, item: WatchlistInput): Promise<void>;
  removeForUser(userId: string, symbol: string): Promise<void>;
}

export type WatchlistFailure = "unauthorized" | "invalid_input" | "invalid_symbol" | "unavailable";

export type WatchlistListResult =
  | { success: true; items: WatchlistEntry[] }
  | { success: false; error: WatchlistFailure };

export type WatchlistMutationResult =
  | { success: true }
  | { success: false; error: WatchlistFailure };

export async function listUserWatchlist(
  userId: string | null,
  repository: WatchlistRepository,
): Promise<WatchlistListResult> {
  if (!userId) return { success: false, error: "unauthorized" };
  try {
    return { success: true, items: await repository.listForUser(userId) };
  } catch {
    return { success: false, error: "unavailable" };
  }
}

export async function addUserWatchlistItem(
  userId: string | null,
  input: unknown,
  repository: WatchlistRepository,
  verifyStock: (symbol: string) => Promise<boolean>,
): Promise<WatchlistMutationResult> {
  if (!userId) return { success: false, error: "unauthorized" };
  const validated = validateWatchlistInput(input);
  if (!validated) return { success: false, error: "invalid_input" };

  try {
    if (!(await verifyStock(validated.symbol))) return { success: false, error: "invalid_symbol" };
    await repository.addForUser(userId, validated);
    return { success: true };
  } catch {
    return { success: false, error: "unavailable" };
  }
}

export async function removeUserWatchlistItem(
  userId: string | null,
  symbolInput: unknown,
  repository: WatchlistRepository,
): Promise<WatchlistMutationResult> {
  if (!userId) return { success: false, error: "unauthorized" };
  const symbol = normalizeStockSymbol(symbolInput);
  if (!symbol) return { success: false, error: "invalid_input" };

  try {
    await repository.removeForUser(userId, symbol);
    return { success: true };
  } catch {
    return { success: false, error: "unavailable" };
  }
}
