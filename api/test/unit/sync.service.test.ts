import { describe, expect, it } from "bun:test";
import { BusinessRuleError, ConflictError } from "../../src/common/errors";
import type { CategoryRepository } from "../../src/modules/categories/category.repository";
import type { SyncRun, SyncRunRepository } from "../../src/modules/sync/sync-run.repository";
import { SYNC_PAGE_SIZE, createSyncService } from "../../src/modules/sync/sync.service";
import type {
  ExternalTemplate,
  TemplateRepository,
} from "../../src/modules/templates/template.repository";
import {
  UpstreamError,
  createMockClient,
  type MarketplaceClient,
  type XBot,
} from "../../src/x-marketplace";

const otherCategory = { id: crypto.randomUUID(), slug: "other" };

const bots = (n: number): XBot[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `bot-${i}`,
    name: `Bot ${i}`,
    description: "Imported bot",
    author: "someone",
  }));

const setup = (client: MarketplaceClient, running: SyncRun | null = null) => {
  const upserted: ExternalTemplate[] = [];
  const finished: unknown[] = [];

  const runs: SyncRunRepository = {
    start: async (triggeredById) => ({
      id: crypto.randomUUID(),
      status: "RUNNING",
      imported: 0,
      error: null,
      triggeredById,
      startedAt: new Date(),
      finishedAt: null,
    }),
    finish: async (id, result) => {
      finished.push(result);
      return {
        id,
        status: result.status,
        imported: result.imported,
        error: result.error ?? null,
        triggeredById: null,
        startedAt: new Date(),
        finishedAt: new Date(),
      };
    },
    findRunningSince: async () => running,
    list: async (page) => ({ ...page, items: [], total: 0 }),
  };

  const templates = {
    upsertExternal: async (data: ExternalTemplate) => {
      upserted.push(data);
    },
  } as TemplateRepository;

  const categories = {
    findBySlug: async (slug: string) => (slug === "other" ? otherCategory : null),
  } as CategoryRepository;

  const service = (slug = "other") =>
    createSyncService(runs, templates, categories, client, { importCategorySlug: slug });

  return { service, upserted, finished };
};

describe("SyncService", () => {
  it("imports all pages from X into the import category", async () => {
    const { service, upserted } = setup(createMockClient(bots(SYNC_PAGE_SIZE + 5)));
    const run = await service().runNow();
    expect(run).toMatchObject({ status: "SUCCESS", imported: SYNC_PAGE_SIZE + 5 });
    expect(upserted).toHaveLength(SYNC_PAGE_SIZE + 5);
    expect(upserted[0]).toMatchObject({
      externalId: "bot-0",
      categoryId: otherCategory.id,
      templateUrl: "grokbot://app/v1/bot-template?id=bot-0",
      externalAuthor: "someone",
    });
  });

  it("records failure when X is unavailable", async () => {
    const failing: MarketplaceClient = {
      listAgents: async () => {
        throw new UpstreamError(503);
      },
      getAgent: async () => null,
    };
    const { service } = setup(failing);
    const run = await service().runNow();
    expect(run.status).toBe("FAILED");
    expect(run.error).toContain("503");
  });

  it("refuses to start while another run is in progress", async () => {
    const running = (await setup(createMockClient([])).service().start(null)).run;
    const { service } = setup(createMockClient([]), running);
    await expect(service().start(null)).rejects.toBeInstanceOf(ConflictError);
  });

  it("requires the import category to exist", async () => {
    const { service } = setup(createMockClient([]));
    await expect(service("missing").start(null)).rejects.toBeInstanceOf(BusinessRuleError);
  });
});
