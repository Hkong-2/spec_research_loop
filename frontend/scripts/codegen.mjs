import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const url = `${base.replace(/\/$/, "")}/openapi.json`;
const out = "lib/api/schema.d.ts";

const result = spawnSync(
  "pnpm",
  ["exec", "openapi-typescript", url, "-o", out],
  { stdio: "inherit", shell: true },
);
process.exit(result.status ?? 1);
