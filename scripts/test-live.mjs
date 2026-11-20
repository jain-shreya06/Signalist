import { spawnSync } from "node:child_process";

const checks = [
  ["Finnhub quote", "scripts/test-finnhub.mjs"],
  ["Gemini generation", "scripts/test-gemini.mjs"],
  ["SMTP verification", "scripts/test-smtp.ts"],
  ["Inngest endpoint", "scripts/test-inngest.mjs"],
];
let failed = false;
let blocked = false;

for (const [label, script] of checks) {
  console.log(`\n--- ${label} ---`);
  const args = script.endsWith(".ts")
    ? ["--conditions=react-server", "--import", "tsx", script]
    : [script];
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status === 2) blocked = true;
  else if (result.status !== 0) failed = true;
}

console.log("\nLive integration summary:");
console.log(failed ? "- At least one live integration failed." : "- No live integration failure was reported.");
console.log(blocked ? "- At least one integration was blocked or not configured." : "- No integration was blocked.");
if (failed) process.exitCode = 1;
else if (blocked) process.exitCode = 2;
