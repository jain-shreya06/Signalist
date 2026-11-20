import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI must be configured.');
    process.exitCode = 1;
    return;
  }

  try {
    const startedAt = Date.now();
    await mongoose.connect(uri, { bufferCommands: false });
    const elapsed = Date.now() - startedAt;
    console.log(`OK: Connected to MongoDB [db="${mongoose.connection?.name || '(unknown)'}", host="${mongoose.connection?.host || '(unknown)'}, time=${elapsed}ms]`);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.error(`ERROR: Database connection failed (${errorName}). Check the database configuration and network access.`);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
    } catch {
      console.warn('MongoDB connection cleanup failed.');
    }
  }
}

main();
