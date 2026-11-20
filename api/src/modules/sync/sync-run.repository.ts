import { and, count, desc, eq, gt } from "drizzle-orm";
import { offsetOf, type Page, type PageRequest } from "../../common/pagination";
import type { Database } from "../../db/client";
import { syncRuns } from "../../db/schema";

export type SyncRun = typeof syncRuns.$inferSelect;

export interface SyncRunRepository {
  start(triggeredById: string | null): Promise<SyncRun>;
  finish(
    id: string,
    result: { status: "SUCCESS" | "FAILED"; imported: number; error?: string },
  ): Promise<SyncRun>;
  findRunningSince(since: Date): Promise<SyncRun | null>;
  list(page: PageRequest): Promise<Page<SyncRun>>;
}

export const createSyncRunRepository = (db: Database): SyncRunRepository => ({
  async start(triggeredById) {
    const [row] = await db.insert(syncRuns).values({ triggeredById }).returning();
    return row!;
  },

  async finish(id, { status, imported, error }) {
    const [row] = await db
      .update(syncRuns)
      .set({ status, imported, error: error ?? null, finishedAt: new Date() })
      .where(eq(syncRuns.id, id))
      .returning();
    return row!;
  },

  async findRunningSince(since) {
    const [row] = await db
      .select()
      .from(syncRuns)
      .where(and(eq(syncRuns.status, "RUNNING"), gt(syncRuns.startedAt, since)))
      .limit(1);
    return row ?? null;
  },

  async list(page) {
    const [items, [total]] = await Promise.all([
      db
        .select()
        .from(syncRuns)
        .orderBy(desc(syncRuns.startedAt))
        .limit(page.limit)
        .offset(offsetOf(page)),
      db.select({ value: count() }).from(syncRuns),
    ]);
    return { items, total: total?.value ?? 0, ...page };
  },
});
