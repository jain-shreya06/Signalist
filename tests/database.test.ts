import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { connectToDatabase } from "../database/mongoose";

test("database connector rejects missing configuration before connecting", async () => {
  const original = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    await assert.rejects(connectToDatabase(), /MONGODB_URI must be configured/);
  } finally {
    if (original === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original;
  }
});

test("database connection failures return a safe error and can be retried", async (t) => {
  const original = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "mongodb://unit.invalid/signalist";
  t.mock.method(console, "error", () => undefined);
  t.mock.method(mongoose, "connect", async () => {
    throw new Error("mongodb://user:private-password@private-host/signalist");
  });

  try {
    await assert.rejects(connectToDatabase(), (error: unknown) => {
      assert(error instanceof Error);
      assert.match(error.message, /MongoDB connection failed/);
      assert.doesNotMatch(error.message, /private-password|private-host/);
      return true;
    });
  } finally {
    if (original === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original;
  }
});

test("database connector caches a successful connection", async (t) => {
  const original = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "mongodb://unit.invalid/signalist";
  t.mock.method(console, "info", () => undefined);
  const connect = t.mock.method(mongoose, "connect", async () => mongoose);

  try {
    const first = await connectToDatabase();
    const second = await connectToDatabase();
    assert.equal(first, mongoose);
    assert.equal(second, first);
    assert.equal(connect.mock.callCount(), 1);
  } finally {
    if (original === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original;
  }
});
