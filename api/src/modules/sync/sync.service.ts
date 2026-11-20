import { BusinessRuleError, ConflictError } from "../../common/errors";
import type { PageRequest } from "../../common/pagination";
import type { MarketplaceClient } from "../../x-marketplace";
import type { CategoryRepository } from "../categories/category.repository";
import type { TemplateRepository } from "../templates/template.repository";
import type { SyncRun, SyncRunRepository } from "./sync-run.repository";

export const SYNC_PAGE_SIZE = 100;
export const STALE_RUN_MINUTES = 15;

export type SyncOptions = { importCategorySlug: string };

export const createSyncService = (
  runs: SyncRunRepository,
  templates: TemplateRepository,
  categories: CategoryRepository,
  client: MarketplaceClient,
  options: SyncOptions,
) => {
  const importAll = async (categoryId: string) => {
    let imported = 0;
    for (let page = 1; ; page++) {
      const result = await client.listAgents({ page, limit: SYNC_PAGE_SIZE });
      for (const agent of result.items) {
        await templates.upsertExternal({
          externalId: agent.id,
          name: agent.name.slice(0, 120),
          description: agent.description,
          templateUrl: agent.templateUrl,
          externalAuthor: agent.author.slice(0, 100),
          categoryId,
        });
        imported++;
      }
      if (result.items.length < SYNC_PAGE_SIZE || page * SYNC_PAGE_SIZE >= result.total) {
        return imported;
      }
    }
  };

  const execute = async (run: SyncRun, categoryId: string) => {
    try {
      const imported = await importAll(categoryId);
      return await runs.finish(run.id, { status: "SUCCESS", imported });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return runs.finish(run.id, { status: "FAILED", imported: 0, error: message });
    }
  };

  const start = async (triggeredById: string | null) => {
    const staleBefore = new Date(Date.now() - STALE_RUN_MINUTES * 60_000);
    if (await runs.findRunningSince(staleBefore)) {
      throw new ConflictError("A synchronization is already running");
    }
    const category = await categories.findBySlug(options.importCategorySlug);
    if (!category) {
      throw new BusinessRuleError(
        `Import category "${options.importCategorySlug}" does not exist`,
      );
    }
    const run = await runs.start(triggeredById);
    return { run, completion: execute(run, category.id) };
  };

  return {
    start,

    async runNow(triggeredById: string | null = null) {
      const { completion } = await start(triggeredById);
      return completion;
    },

    listRuns: (page: PageRequest) => runs.list(page),
  };
};

export type SyncService = ReturnType<typeof createSyncService>;
