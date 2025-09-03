import { PrismaClient } from "@prisma/client";

declare global {
  var __globalPrisma: PrismaClient | undefined;
}

// Create a new Prisma client with optimized configuration
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pool configuration
    // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"], // Enable query logging in development
  });
};

export const prisma = globalThis.__globalPrisma || createPrismaClient();

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
  globalThis.__globalPrisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
