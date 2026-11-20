import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addUserWatchlistItem,
  listUserWatchlist,
  removeUserWatchlistItem,
  type WatchlistEntry,
  type WatchlistRepository,
} from "../lib/watchlist/service";
import { normalizeStockSymbol, validateWatchlistInput } from "../lib/watchlist/validation";

function createRepository() {
  const records = new Map<string, WatchlistEntry[]>();
  let writes = 0;
  const repository: WatchlistRepository = {
    async listForUser(userId) {
      return [...(records.get(userId) || [])];
    },
    async addForUser(userId, item) {
      writes++;
      const items = records.get(userId) || [];
      if (!items.some((entry) => entry.symbol === item.symbol)) {
        items.push({ ...item, addedAt: new Date("2026-01-01T00:00:00Z") });
      }
      records.set(userId, items);
    },
    async removeForUser(userId, symbol) {
      writes++;
      records.set(userId, (records.get(userId) || []).filter((entry) => entry.symbol !== symbol));
    },
  };
  return { repository, records, getWrites: () => writes };
}

test("watchlist validation normalizes stock symbols and rejects malformed values", () => {
  assert.equal(normalizeStockSymbol(" brk.b "), "BRK.B");
  assert.equal(normalizeStockSymbol("AAPL/../../user"), null);
  assert.equal(normalizeStockSymbol("BTC-USD"), "BTC-USD");
  assert.deepEqual(validateWatchlistInput({ symbol: "msft", company: " Microsoft " }), {
    symbol: "MSFT",
    company: "Microsoft",
  });
  assert.equal(validateWatchlistInput({ symbol: "AAPL", company: "   " }), null);
  assert.equal(validateWatchlistInput({ symbol: "AAPL", company: "x".repeat(121) }), null);
});

test("watchlist operations require an authenticated owner and scope all reads and writes", async () => {
  const { repository, records, getWrites } = createRepository();
  const verify = async () => true;
  assert.deepEqual(await addUserWatchlistItem(null, { symbol: "AAPL", company: "Apple" }, repository, verify), {
    success: false,
    error: "unauthorized",
  });
  assert.deepEqual(await listUserWatchlist(null, repository), { success: false, error: "unauthorized" });
  assert.deepEqual(await removeUserWatchlistItem(null, "AAPL", repository), {
    success: false,
    error: "unauthorized",
  });
  assert.equal(getWrites(), 0);

  await addUserWatchlistItem("user-a", { symbol: "AAPL", company: "Apple" }, repository, verify);
  await addUserWatchlistItem("user-b", { symbol: "AAPL", company: "Apple" }, repository, verify);
  await removeUserWatchlistItem("user-a", "AAPL", repository);

  assert.deepEqual(records.get("user-a"), []);
  assert.equal(records.get("user-b")?.[0]?.symbol, "AAPL");
  assert.deepEqual((await listUserWatchlist("user-b", repository)).success, true);
});

test("watchlist rejects malformed or unsupported symbols without writing", async () => {
  const { repository, getWrites } = createRepository();
  const verify = async (symbol: string) => symbol === "AAPL";

  assert.deepEqual(await addUserWatchlistItem("user-a", { symbol: "../AAPL", company: "Apple" }, repository, verify), {
    success: false,
    error: "invalid_input",
  });
  assert.deepEqual(await addUserWatchlistItem("user-a", { symbol: "NOPE", company: "Unknown" }, repository, verify), {
    success: false,
    error: "invalid_symbol",
  });
  assert.equal(getWrites(), 0);
});

test("watchlist reports repository failures without exposing database errors", async () => {
  const repository: WatchlistRepository = {
    async listForUser() { throw new Error("mongodb://private-credential@host"); },
    async addForUser() { throw new Error("mongodb://private-credential@host"); },
    async removeForUser() { throw new Error("mongodb://private-credential@host"); },
  };
  const verify = async () => true;

  assert.deepEqual(await listUserWatchlist("user-a", repository), { success: false, error: "unavailable" });
  assert.deepEqual(
    await addUserWatchlistItem("user-a", { symbol: "AAPL", company: "Apple" }, repository, verify),
    { success: false, error: "unavailable" },
  );
  assert.deepEqual(await removeUserWatchlistItem("user-a", "AAPL", repository), {
    success: false,
    error: "unavailable",
  });
});
