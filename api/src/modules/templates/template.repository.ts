import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { offsetOf, type Page, type PageRequest } from "../../common/pagination";
import type { Database } from "../../db/client";
import { installations, reviews, templates } from "../../db/schema";
import type { Category } from "../categories/category.repository";

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateStatus = Template["status"];
export type TemplateSort = "newest" | "popular" | "rating" | "name";

export type TemplateDetails = Template & {
  author: { id: string; displayName: string } | null;
  category: Category;
};

export type TemplateFilter = {
  q?: string;
  categoryId?: string;
  authorId?: string;
  status?: TemplateStatus;
  source?: Template["source"];
  sort?: TemplateSort;
};

export type TemplateChanges = Partial<
  Pick<
    NewTemplate,
    "name" | "description" | "templateUrl" | "categoryId" | "status" | "publishedAt"
  >
>;

export interface TemplateRepository {
  list(query: PageRequest & TemplateFilter): Promise<Page<TemplateDetails>>;
  findById(id: string): Promise<TemplateDetails | null>;
  create(data: NewTemplate): Promise<TemplateDetails>;
  update(id: string, expectedVersion: number, changes: TemplateChanges): Promise<TemplateDetails | null>;
  delete(id: string): Promise<void>;
  countInstallations(id: string): Promise<number>;
  refreshInstallStats(id: string): Promise<void>;
  refreshRatingStats(id: string): Promise<void>;
}

const orderBy = (sort: TemplateSort = "newest") => {
  switch (sort) {
    case "popular":
      return [desc(templates.installsCount), desc(templates.createdAt)];
    case "rating":
      return [desc(templates.ratingAvg), desc(templates.ratingCount)];
    case "name":
      return [asc(templates.name)];
    default:
      return [desc(templates.publishedAt), desc(templates.createdAt)];
  }
};

const buildWhere = (filter: TemplateFilter): SQL | undefined => {
  const conditions: (SQL | undefined)[] = [
    filter.q
      ? or(
          ilike(templates.name, `%${filter.q}%`),
          ilike(templates.description, `%${filter.q}%`),
        )
      : undefined,
    filter.categoryId ? eq(templates.categoryId, filter.categoryId) : undefined,
    filter.authorId ? eq(templates.authorId, filter.authorId) : undefined,
    filter.status ? eq(templates.status, filter.status) : undefined,
    filter.source ? eq(templates.source, filter.source) : undefined,
  ];
  return and(...conditions.filter((c): c is SQL => c !== undefined));
};

export const createTemplateRepository = (db: Database): TemplateRepository => {
  const withRelations = {
    author: { columns: { id: true, displayName: true } },
    category: true,
  } as const;

  const findById = async (id: string) =>
    (await db.query.templates.findFirst({
      where: eq(templates.id, id),
      with: withRelations,
    })) ?? null;

  return {
    async list({ page, limit, ...filter }) {
      const where = buildWhere(filter);
      const [items, [total]] = await Promise.all([
        db.query.templates.findMany({
          where,
          with: withRelations,
          orderBy: orderBy(filter.sort),
          limit,
          offset: offsetOf({ page, limit }),
        }),
        db.select({ value: count() }).from(templates).where(where),
      ]);
      return { items, total: total?.value ?? 0, page, limit };
    },

    findById,

    async create(data) {
      const [row] = await db.insert(templates).values(data).returning({ id: templates.id });
      return (await findById(row!.id))!;
    },

    async update(id, expectedVersion, changes) {
      const [row] = await db
        .update(templates)
        .set({ ...changes, version: sql`${templates.version} + 1` })
        .where(and(eq(templates.id, id), eq(templates.version, expectedVersion)))
        .returning({ id: templates.id });
      return row ? findById(row.id) : null;
    },

    async delete(id) {
      await db.delete(templates).where(eq(templates.id, id));
    },

    async refreshInstallStats(id) {
      await db
        .update(templates)
        .set({
          installsCount: sql`(select count(*) from ${installations} where ${installations.templateId} = ${id})`,
        })
        .where(eq(templates.id, id));
    },

    async refreshRatingStats(id) {
      await db
        .update(templates)
        .set({
          ratingCount: sql`(select count(*) from ${reviews} where ${reviews.templateId} = ${id})`,
          ratingAvg: sql`coalesce((select round(avg(${reviews.rating}), 2) from ${reviews} where ${reviews.templateId} = ${id}), 0)`,
        })
        .where(eq(templates.id, id));
    },

    async countInstallations(id) {
      const [row] = await db
        .select({ value: count() })
        .from(installations)
        .where(eq(installations.templateId, id));
      return row?.value ?? 0;
    },
  };
};
