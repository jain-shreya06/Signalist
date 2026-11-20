import { connectToDatabase } from "../database/mongoose";

async function main() {
  try {
    await connectToDatabase();
    // If connectToDatabase resolves without throwing, connection is OK
    console.log("OK: Database connection succeeded");
    process.exit(0);
  } catch {
    console.error("ERROR: Database connection failed");
    console.error("Check the database configuration and network access.");
    process.exit(1);
  }
}

main();
