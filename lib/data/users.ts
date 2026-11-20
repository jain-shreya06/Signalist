import "server-only";
import { connectToDatabase } from "@/database/mongoose";

export async function getAllUsersForNewsEmail(): Promise<UserForNewsEmail[]> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found.");

    const users = await db.collection("user").find<{
      _id?: { toString(): string };
      id?: string;
      email?: string;
      name?: string;
    }>(
      { email: { $exists: true, $ne: null } },
      { projection: { _id: 1, id: 1, email: 1, name: 1 } },
    ).toArray();

    return users.flatMap((user) => {
      if (typeof user.email !== "string" || typeof user.name !== "string" || !user.name.trim()) return [];
      return [{
        id: typeof user.id === "string" ? user.id : user._id?.toString() || "",
        email: user.email,
        name: user.name,
      }];
    });
  } catch {
    console.error("Unable to fetch email recipients from the database.");
    throw new Error("Email recipient lookup failed.");
  }
}
