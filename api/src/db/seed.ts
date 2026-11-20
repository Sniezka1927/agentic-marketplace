import { config } from "../config";
import { db, sqlClient } from "./client";
import { categories, users } from "./schema";

const defaultCategories = [
  { name: "Productivity", slug: "productivity" },
  { name: "Development", slug: "development" },
  { name: "Research", slug: "research" },
  { name: "Writing", slug: "writing" },
  { name: "Automation", slug: "automation" },
  { name: "Other", slug: "other" },
];

await db.insert(categories).values(defaultCategories).onConflictDoNothing();

if (config.admin.email && config.admin.password) {
  await db
    .insert(users)
    .values({
      email: config.admin.email.toLowerCase(),
      passwordHash: await Bun.password.hash(config.admin.password),
      displayName: "Admin",
      role: "ADMIN",
    })
    .onConflictDoNothing({ target: users.email });
} else {
  console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
}

console.log("Seed completed");
await sqlClient.close();
