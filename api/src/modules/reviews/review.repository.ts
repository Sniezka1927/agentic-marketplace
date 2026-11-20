import { and, count, desc, eq } from "drizzle-orm";
import { offsetOf, type Page, type PageRequest } from "../../common/pagination";
import type { Database } from "../../db/client";
import { reviews } from "../../db/schema";

export type Review = typeof reviews.$inferSelect;
export type ReviewWithUser = Review & { user: { id: string; displayName: string } };
export type ReviewChanges = Partial<Pick<Review, "rating" | "comment">>;

export interface ReviewRepository {
  findById(id: string): Promise<ReviewWithUser | null>;
  findByUserAndTemplate(userId: string, templateId: string): Promise<Review | null>;
  create(data: {
    userId: string;
    templateId: string;
    rating: number;
    comment: string;
  }): Promise<ReviewWithUser>;
  update(id: string, changes: ReviewChanges): Promise<ReviewWithUser>;
  delete(id: string): Promise<void>;
  listByTemplate(templateId: string, page: PageRequest): Promise<Page<ReviewWithUser>>;
}

export const createReviewRepository = (db: Database): ReviewRepository => {
  const withUser = { user: { columns: { id: true, displayName: true } } } as const;

  const findById = async (id: string) =>
    (await db.query.reviews.findFirst({ where: eq(reviews.id, id), with: withUser })) ??
    null;

  return {
    findById,

    async findByUserAndTemplate(userId, templateId) {
      const [row] = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.templateId, templateId)));
      return row ?? null;
    },

    async create(data) {
      const [row] = await db.insert(reviews).values(data).returning({ id: reviews.id });
      return (await findById(row!.id))!;
    },

    async update(id, changes) {
      await db.update(reviews).set(changes).where(eq(reviews.id, id));
      return (await findById(id))!;
    },

    async delete(id) {
      await db.delete(reviews).where(eq(reviews.id, id));
    },

    async listByTemplate(templateId, page) {
      const where = eq(reviews.templateId, templateId);
      const [items, [total]] = await Promise.all([
        db.query.reviews.findMany({
          where,
          with: withUser,
          orderBy: desc(reviews.createdAt),
          limit: page.limit,
          offset: offsetOf(page),
        }),
        db.select({ value: count() }).from(reviews).where(where),
      ]);
      return { items, total: total?.value ?? 0, ...page };
    },
  };
};
