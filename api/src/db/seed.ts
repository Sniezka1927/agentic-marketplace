import { config } from "../config";
import { db, sqlClient } from "./client";
import { demoBots } from "./demo-bots";
import { categories, templates, users } from "./schema";

const defaultCategories = [
  { name: "Engineering", slug: "engineering" },
  { name: "Sales", slug: "sales" },
  { name: "Marketing", slug: "marketing" },
  { name: "Design", slug: "design" },
  { name: "Product", slug: "product" },
  { name: "Operations", slug: "operations" },
  { name: "Personal", slug: "personal" },
  { name: "Recruiting & People", slug: "recruiting-people" },
];

const DEMO_AUTHOR_EMAIL = "marketplace@agentic-marketplace.local";

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

const [demoAuthor] = await db
  .insert(users)
  .values({
    email: DEMO_AUTHOR_EMAIL,
    passwordHash: await Bun.password.hash(crypto.getRandomValues(new Uint8Array(32)).toHex()),
    displayName: "x.ai Marketplace",
  })
  .onConflictDoNothing({ target: users.email })
  .returning({ id: users.id });

if (demoAuthor) {
  const categoryIds = new Map(
    (await db.select({ id: categories.id, slug: categories.slug }).from(categories)).map(
      (category) => [category.slug, category.id],
    ),
  );
  const now = Date.now();
  await db
    .insert(templates)
    .values(
      demoBots.map((bot, index) => ({
        name: bot.name,
        description: bot.description,
        externalId: bot.botId,
        categoryId: categoryIds.get(bot.category)!,
        authorId: demoAuthor.id,
        status: "PUBLISHED" as const,
        publishedAt: new Date(now - index * 3_600_000),
      })),
    )
    .onConflictDoNothing({ target: templates.externalId });
  console.log(`Seeded ${demoBots.length} demo bots from the x.ai marketplace`);
}

console.log("Seed completed");
await sqlClient.close();
