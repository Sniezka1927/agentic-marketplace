import { count, desc, eq, ilike, or } from "drizzle-orm";
import { offsetOf, type Page, type PageRequest } from "../../common/pagination";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = User["role"];

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  list(page: PageRequest & { q?: string }): Promise<Page<User>>;
  updateRole(id: string, role: Role): Promise<User>;
}

export const createUserRepository = (db: Database): UserRepository => ({
  async findById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row ?? null;
  },

  async findByEmail(email) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row ?? null;
  },

  async create(data) {
    const [row] = await db.insert(users).values(data).returning();
    return row!;
  },

  async list({ q, ...page }) {
    const where = q
      ? or(ilike(users.email, `%${q}%`), ilike(users.displayName, `%${q}%`))
      : undefined;
    const [items, [total]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(page.limit)
        .offset(offsetOf(page)),
      db.select({ value: count() }).from(users).where(where),
    ]);
    return { items, total: total?.value ?? 0, ...page };
  },

  async updateRole(id, role) {
    const [row] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return row!;
  },
});
