import "@/lib/polyfills";
import { cache } from "react";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { requireDatabaseUrl } from "@/lib/production-env";

function createAdapter(connectionString: string) {
  if (connectionString.includes("neon.tech")) {
    return new PrismaNeon({ connectionString });
  }
  return new PrismaPg({ connectionString });
}

function createPrismaClient(): PrismaClient {
  const connectionString = requireDatabaseUrl(
    process.env,
    "create the Prisma client",
  );

  return new PrismaClient({
    adapter: createAdapter(connectionString),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const getPrisma = cache((): PrismaClient => {
  return createPrismaClient();
});

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
