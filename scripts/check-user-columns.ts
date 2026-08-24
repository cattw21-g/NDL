import "dotenv/config";
import { prisma } from "../src/lib/db.js";

async function main() {
  console.log("🔍 Checking columns on Neon PostgreSQL User table...");

  const cols = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'User'
    ORDER BY column_name;
  `;

  console.log("Columns in 'User' table:");
  for (const c of cols) {
    console.log(`  - ${c.column_name} (${c.data_type})`);
  }
}

main().catch(console.error);
