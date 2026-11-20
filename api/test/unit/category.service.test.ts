import { beforeEach, describe, expect, it } from "bun:test";
import { ConflictError, NotFoundError } from "../../src/common/errors";
import type {
  Category,
  CategoryRepository,
} from "../../src/modules/categories/category.repository";
import {
  createCategoryService,
  type CategoryService,
} from "../../src/modules/categories/category.service";

const createFakeRepo = () => {
  const rows = new Map<string, Category>();
  const templateCounts = new Map<string, number>();

  const repo: CategoryRepository = {
    findAll: async () => [...rows.values()],
    findById: async (id) => rows.get(id) ?? null,
    findBySlug: async (slug) =>
      [...rows.values()].find((c) => c.slug === slug) ?? null,
    create: async (data) => {
      const now = new Date();
      const row: Category = {
        id: crypto.randomUUID(),
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        createdAt: now,
        updatedAt: now,
      };
      rows.set(row.id, row);
      return row;
    },
    update: async (id, data) => {
      const row = { ...rows.get(id)!, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) };
      rows.set(id, row);
      return row;
    },
    delete: async (id) => {
      rows.delete(id);
    },
    countTemplates: async (id) => templateCounts.get(id) ?? 0,
  };

  return { repo, rows, templateCounts };
};

describe("CategoryService", () => {
  let fake: ReturnType<typeof createFakeRepo>;
  let service: CategoryService;

  beforeEach(() => {
    fake = createFakeRepo();
    service = createCategoryService(fake.repo);
  });

  it("derives slug from name", async () => {
    const category = await service.create({ name: "Data Science & ML" });
    expect(category.slug).toBe("data-science-ml");
  });

  it("rejects duplicate slug", async () => {
    await service.create({ name: "Writing" });
    await expect(service.create({ name: "writing" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows keeping own slug on update", async () => {
    const category = await service.create({ name: "Writing" });
    const updated = await service.update(category.id, { slug: "writing", name: "Copywriting" });
    expect(updated.name).toBe("Copywriting");
  });

  it("throws NotFoundError for unknown category", async () => {
    await expect(service.get(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses to delete category with templates", async () => {
    const category = await service.create({ name: "Research" });
    fake.templateCounts.set(category.id, 2);
    await expect(service.remove(category.id)).rejects.toBeInstanceOf(ConflictError);
    expect(fake.rows.has(category.id)).toBe(true);
  });

  it("deletes empty category", async () => {
    const category = await service.create({ name: "Research" });
    await service.remove(category.id);
    expect(fake.rows.has(category.id)).toBe(false);
  });
});
