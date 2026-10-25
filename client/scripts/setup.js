// Runs after `npm i`: creates .env from .env.example if missing. Never throws.
import { existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

try {
  if (!existsSync(envPath) && existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log("\n✔ Created .env. Start the app with: npm run dev\n");
  }
} catch (err) {
  console.warn("Skipping .env setup:", err.message);
}
