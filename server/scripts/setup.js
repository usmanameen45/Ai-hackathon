// Runs automatically after `npm i`. Creates .env from .env.example with a random auth secret.
// Never throws: a failed setup must not break installs (e.g. CI or Docker builds).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

try {
  if (existsSync(envPath) || !existsSync(examplePath)) process.exit(0);

  const secret = randomBytes(32).toString("base64");
  const content = readFileSync(examplePath, "utf8").replace(
    "BETTER_AUTH_SECRET=replace-with-a-long-random-string-min-32-chars",
    `BETTER_AUTH_SECRET=${secret}`,
  );
  writeFileSync(envPath, content);
  console.log("\n✔ Created .env with a generated BETTER_AUTH_SECRET.");
  console.log("  Make sure MongoDB is running, then start the server with: npm run dev\n");
} catch (err) {
  console.warn("Skipping .env setup:", err.message);
}
