import "server-only";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import type { WatchlistRepository } from "@/lib/watchlist/service";

export const watchlistRepository: WatchlistRepository = {
  async listForUser(userId) {
    const items = await Watchlist.find({ userId })
      .select({ symbol: 1, company: 1, addedAt: 1, _id: 0 })
      .sort({ addedAt: -1 })
      .lean()
      .exec();
    return items.map((item) => ({
      symbol: String(item.symbol),
      company: String(item.company),
      addedAt: item.addedAt,
    }));
  },

  async addForUser(userId, item) {
    await Watchlist.updateOne(
      { userId, symbol: item.symbol },
      { $setOnInsert: { userId, symbol: item.symbol, company: item.company, addedAt: new Date() } },
      { upsert: true },
    ).exec();
  },

  async removeForUser(userId, symbol) {
    await Watchlist.deleteOne({ userId, symbol }).exec();
  },
};

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email.trim()) return [];
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found.");

    const user = await db.collection("user").findOne<{ id?: string; _id?: { toString(): string } }>(
      { email: email.trim().toLowerCase() },
      { projection: { _id: 1, id: 1 } },
    );
    const userId = user?.id || user?._id?.toString();
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean().exec();
    return items.map((item) => String(item.symbol));
  } catch {
    console.error("Unable to load watchlist symbols for the scheduled digest.");
    throw new Error("Scheduled digest watchlist lookup failed.");
  }
}
