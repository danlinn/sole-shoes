/**
 * Runs `prisma db seed` unless SKIP_DB_SEED=1.
 * Use SKIP_DB_SEED in CI (no real DB / Neon WebSocket) so `npm run build` can succeed.
 */
import { spawnSync } from "node:child_process";

if (process.env.SKIP_DB_SEED === "1") {
  console.log("Skipping prisma db seed (SKIP_DB_SEED=1).");
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["prisma", "db", "seed"],
  { stdio: "inherit", shell: true }
);

process.exit(result.status ?? 1);
