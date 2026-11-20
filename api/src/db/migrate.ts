import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db, sqlClient } from "./client";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied");
await sqlClient.close();
