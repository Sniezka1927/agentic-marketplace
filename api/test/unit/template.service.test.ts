import { beforeEach, describe, expect, it } from "bun:test";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../src/common/errors";
import type {
  Category,
  CategoryRepository,
} from "../../src/modules/categories/category.repository";
import type {
  TemplateDetails,
  TemplateRepository,
} from "../../src/modules/templates/template.repository";
import {
  createTemplateService,
  type TemplateService,
} from "../../src/modules/templates/template.service";

const category: Category = {
  id: crypto.randomUUID(),
  name: "Productivity",
  slug: "productivity",
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const author = { id: crypto.randomUUID(), role: "USER" as const };
const stranger = { id: crypto.randomUUID(), role: "USER" as const };
const admin = { id: crypto.randomUUID(), role: "ADMIN" as const };

const longDescription = "Helps you sort files and draft weekly reports.";

const createFakes = () => {
  const rows = new Map<string, TemplateDetails>();
  const installs = new Map<string, number>();

  const templates: TemplateRepository = {
    list: async (query) => ({
      ...query,
      items: [...rows.values()],
      total: rows.size,
    }),
    findById: async (id) => rows.get(id) ?? null,
    create: async (data) => {
      const now = new Date();
      const row: TemplateDetails = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description ?? "",
        templateUrl: data.templateUrl,
        status: data.status ?? "DRAFT",
        source: data.source ?? "LOCAL",
        externalId: null,
        externalAuthor: null,
        authorId: data.authorId ?? null,
        categoryId: data.categoryId,
        version: 1,
        installsCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        author: data.authorId ? { id: data.authorId, displayName: "Author" } : null,
        category,
      };
      rows.set(row.id, row);
      return row;
    },
    update: async (id, expectedVersion, changes) => {
      const row = rows.get(id);
      if (!row || row.version !== expectedVersion) return null;
      const defined = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined),
      );
      const updated = { ...row, ...defined, version: row.version + 1 };
      rows.set(id, updated);
      return updated;
    },
    delete: async (id) => {
      rows.delete(id);
    },
    countInstallations: async (id) => installs.get(id) ?? 0,
    upsertExternal: async () => {},
    refreshInstallStats: async () => {},
    refreshRatingStats: async () => {},
  };

  const categories = {
    findById: async (id: string) => (id === category.id ? category : null),
  } as CategoryRepository;

  return { templates, categories, rows, installs };
};

describe("TemplateService", () => {
  let fakes: ReturnType<typeof createFakes>;
  let service: TemplateService;

  beforeEach(() => {
    fakes = createFakes();
    service = createTemplateService(fakes.templates, fakes.categories);
  });

  const draft = (description = longDescription) =>
    service.create(author, {
      name: "File Sorter",
      description,
      templateUrl: "grokbot://app/v1/bot-template?id=abc",
      categoryId: category.id,
    });

  it("creates templates as drafts owned by the caller", async () => {
    const template = await draft();
    expect(template.status).toBe("DRAFT");
    expect(template.authorId).toBe(author.id);
  });

  it("rejects unknown category", async () => {
    await expect(
      service.create(author, {
        name: "X",
        templateUrl: "https://example.com",
        categoryId: crypto.randomUUID(),
      }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("hides drafts from other users but shows them to author and admin", async () => {
    const template = await draft();
    await expect(service.get(template.id, stranger)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.get(template.id, null)).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.get(template.id, author)).id).toBe(template.id);
    expect((await service.get(template.id, admin)).id).toBe(template.id);
  });

  it("does not let other users modify a published template", async () => {
    const template = await draft();
    await service.publish(author, template.id);
    await expect(
      service.update(stranger, template.id, { name: "Hacked", version: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets admin modify any template", async () => {
    const template = await draft();
    const updated = await service.update(admin, template.id, { name: "Renamed", version: 1 });
    expect(updated.name).toBe("Renamed");
  });

  it("rejects update with stale version (optimistic locking)", async () => {
    const template = await draft();
    await service.update(author, template.id, { name: "First", version: 1 });
    await expect(
      service.update(author, template.id, { name: "Second", version: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("requires a meaningful description to publish", async () => {
    const template = await draft("Too short");
    await expect(service.publish(author, template.id)).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("publishes and sets publishedAt", async () => {
    const template = await draft();
    const published = await service.publish(author, template.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeInstanceOf(Date);
  });

  it("refuses to delete template with installations", async () => {
    const template = await draft();
    fakes.installs.set(template.id, 3);
    await expect(service.remove(author, template.id)).rejects.toBeInstanceOf(ConflictError);
    expect(fakes.rows.has(template.id)).toBe(true);
  });

  it("deletes template without installations", async () => {
    const template = await draft();
    await service.remove(author, template.id);
    expect(fakes.rows.has(template.id)).toBe(false);
  });
});
