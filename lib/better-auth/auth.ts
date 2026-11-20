import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

const createAuth = async () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET must be configured.");

  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) throw new Error("BETTER_AUTH_URL must be configured.");

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not found.");

  return betterAuth({
    database: mongodbAdapter(db as unknown as Parameters<typeof mongodbAdapter>[0]),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
  });
};

let authPromise: ReturnType<typeof createAuth> | undefined;

export const getAuth = () => {
  if (!authPromise) {
    authPromise = createAuth().catch((error: unknown) => {
      authPromise = undefined;
      throw error;
    });
  }
  return authPromise;
};
