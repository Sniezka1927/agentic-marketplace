import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../config";
import * as schema from "./schema";

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const sqlClient = new SQL(config.databaseUrl);
export const db = drizzle({ client: sqlClient, schema });
export type Database = typeof db;
