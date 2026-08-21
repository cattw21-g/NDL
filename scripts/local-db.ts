import EmbeddedPostgres from "embedded-postgres";
import fs from "fs";
import path from "path";

const databaseDir = path.resolve(__dirname, "../.pgdata");
const port = 5432;
const user = "ndl";
const password = "ndl_dev_password";

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  const isInitialised = fs.existsSync(path.join(databaseDir, "PG_VERSION"));
  if (!isInitialised) {
    console.log("Initializing local PostgreSQL data directory with UTF-8 encoding in ./.pgdata...");
    await pg.initialise();
  }

  console.log(`Starting local PostgreSQL server on port ${port}...`);
  await pg.start();

  try {
    await pg.createDatabase("ndl");
    console.log("Database 'ndl' ready.");
  } catch (err: any) {
    if (!err?.message?.includes("already exists")) {
      // Database might already exist, which is normal on subsequent runs
    }
  }

  console.log("==================================================");
  console.log("✓ Local PostgreSQL is running natively!");
  console.log(`  Database URL: postgresql://${user}:${password}@localhost:${port}/ndl?schema=public`);
  console.log("  No Docker or BIOS virtualization required.");
  console.log("==================================================");

  const cleanup = async () => {
    console.log("\nStopping local PostgreSQL...");
    try {
      await pg.stop();
    } catch {
      // Ignore cleanup error on exit
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Keep alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error("Failed to run local postgres:", err);
  process.exit(1);
});
