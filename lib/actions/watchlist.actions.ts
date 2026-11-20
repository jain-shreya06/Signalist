'use server';

import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { watchlistRepository } from "@/lib/data/watchlist";
import {
  addUserWatchlistItem,
  listUserWatchlist,
  removeUserWatchlistItem,
} from "@/lib/watchlist/service";
import { verifyFinnhubStock } from "@/lib/finnhub/client";

async function currentUserId(): Promise<string | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return getAuthenticatedUserId(session);
}

async function verifyStockSymbol(symbol: string): Promise<boolean> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("Stock validation is unavailable.");
  return verifyFinnhubStock(symbol, token);
}

export async function getMyWatchlist() {
  try {
    return await listUserWatchlist(await currentUserId(), watchlistRepository);
  } catch {
    return { success: false as const, error: "unavailable" as const };
  }
}

export async function addWatchlistItem(input: unknown) {
  try {
    return await addUserWatchlistItem(
      await currentUserId(),
      input,
      watchlistRepository,
      verifyStockSymbol,
    );
  } catch {
    return { success: false as const, error: "unavailable" as const };
  }
}

export async function removeWatchlistItem(symbol: unknown) {
  try {
    return await removeUserWatchlistItem(
      await currentUserId(),
      symbol,
      watchlistRepository,
    );
  } catch {
    return { success: false as const, error: "unavailable" as const };
  }
}
