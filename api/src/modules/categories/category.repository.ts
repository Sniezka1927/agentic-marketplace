import { asc, count, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { categories, templates } from "../../db/schema";

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  create(data: NewCategory): Promise<Category>;
  update(id: string, data: Partial<NewCategory>): Promise<Category>;
  delete(id: string): Promise<void>;
  countTemplates(id: string): Promise<number>;
}

export const createCategoryRepository = (db: Database): CategoryRepository => ({
  findAll: () => db.select().from(categories).orderBy(asc(categories.name)),

  async findById(id) {
    const [row] = await db.select().from(categories).where(eq(categories.id, id));
    return row ?? null;
  },

  async findBySlug(slug) {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return row ?? null;
  },

  async create(data) {
    const [row] = await db.insert(categories).values(data).returning();
    return row!;
  },

  async update(id, data) {
    const [row] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return row!;
  },

  async delete(id) {
    await db.delete(categories).where(eq(categories.id, id));
  },

  async countTemplates(id) {
    const [row] = await db
      .select({ value: count() })
      .from(templates)
      .where(eq(templates.categoryId, id));
    return row?.value ?? 0;
  },
});
