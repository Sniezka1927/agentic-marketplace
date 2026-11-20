import { and, count, desc, eq } from "drizzle-orm";
import { offsetOf, type Page, type PageRequest } from "../../common/pagination";
import type { Database } from "../../db/client";
import { installations } from "../../db/schema";
import type { TemplateDetails } from "../templates/template.repository";

export type Installation = typeof installations.$inferSelect;
export type InstallationWithTemplate = Installation & { template: TemplateDetails };

export interface InstallationRepository {
  find(userId: string, templateId: string): Promise<Installation | null>;
  create(userId: string, templateId: string): Promise<Installation>;
  delete(userId: string, templateId: string): Promise<void>;
  listByUser(userId: string, page: PageRequest): Promise<Page<InstallationWithTemplate>>;
}

export const createInstallationRepository = (db: Database): InstallationRepository => {
  const byUserAndTemplate = (userId: string, templateId: string) =>
    and(eq(installations.userId, userId), eq(installations.templateId, templateId));

  return {
    async find(userId, templateId) {
      const [row] = await db
        .select()
        .from(installations)
        .where(byUserAndTemplate(userId, templateId));
      return row ?? null;
    },

    async create(userId, templateId) {
      const [row] = await db.insert(installations).values({ userId, templateId }).returning();
      return row!;
    },

    async delete(userId, templateId) {
      await db.delete(installations).where(byUserAndTemplate(userId, templateId));
    },

    async listByUser(userId, page) {
      const where = eq(installations.userId, userId);
      const [items, [total]] = await Promise.all([
        db.query.installations.findMany({
          where,
          with: {
            template: {
              with: {
                author: { columns: { id: true, displayName: true } },
                category: true,
              },
            },
          },
          orderBy: desc(installations.installedAt),
          limit: page.limit,
          offset: offsetOf(page),
        }),
        db.select({ value: count() }).from(installations).where(where),
      ]);
      return { items, total: total?.value ?? 0, ...page };
    },
  };
};
