import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(cmd: string, args: string[]) {
  await execFileAsync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
  });
}

export async function ensureDevDbSchema() {
  // In local docker dev we want the app to start without manual migration steps.
  // `prisma db push` is a pragmatic dev-only choice; production uses migrations/IaC.
  if (process.env.NODE_ENV !== "development") return;

  try {
    await run("npx", ["prisma", "db", "push", "--skip-generate"]);
    await run("npx", ["prisma", "generate"]);
  } catch {
    // If prisma isn't available or DB isn't ready yet, fail fast so compose restarts.
    throw new Error("db_schema_sync_failed");
  }
}

