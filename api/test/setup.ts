export {};

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";
process.env.JWT_SECRET ??= crypto.getRandomValues(new Uint8Array(32)).toHex();

if (process.env.DATABASE_URL) {
  const { db } = await import("../src/db/client");
  const { migrate } = await import("drizzle-orm/bun-sql/migrator");
  await migrate(db, { migrationsFolder: "./drizzle" });
}
