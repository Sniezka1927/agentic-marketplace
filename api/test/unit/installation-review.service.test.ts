import { beforeEach, describe, expect, it } from "bun:test";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../src/common/errors";
import type {
  Installation,
  InstallationRepository,
} from "../../src/modules/installations/installation.repository";
import { createInstallationService } from "../../src/modules/installations/installation.service";
import type {
  ReviewRepository,
  ReviewWithUser,
} from "../../src/modules/reviews/review.repository";
import { createReviewService } from "../../src/modules/reviews/review.service";
import type { EventPublisher } from "../../src/events/event-bus";
import type {
  TemplateDetails,
  TemplateRepository,
} from "../../src/modules/templates/template.repository";

const authorId = crypto.randomUUID();
const user = { id: crypto.randomUUID(), role: "USER" as const };
const otherUser = { id: crypto.randomUUID(), role: "USER" as const };
const admin = { id: crypto.randomUUID(), role: "ADMIN" as const };

const makeTemplate = (status: TemplateDetails["status"]): TemplateDetails => ({
  id: crypto.randomUUID(),
  name: "Bot",
  description: "A helpful bot for everyday tasks.",
  status,
  externalId: crypto.randomUUID(),
  authorId,
  categoryId: crypto.randomUUID(),
  version: 1,
  installsCount: 0,
  ratingAvg: 0,
  ratingCount: 0,
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { id: authorId, displayName: "Author" },
  category: {
    id: crypto.randomUUID(),
    name: "C",
    slug: "c",
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

const createFakes = () => {
  const templates = new Map<string, TemplateDetails>();
  const installs: Installation[] = [];
  const reviews = new Map<string, ReviewWithUser>();

  const templateRepo = {
    findById: async (id: string) => templates.get(id) ?? null,
  } as TemplateRepository;

  const installationRepo: InstallationRepository = {
    find: async (userId, templateId) =>
      installs.find((i) => i.userId === userId && i.templateId === templateId) ?? null,
    create: async (userId, templateId) => {
      const row = { id: crypto.randomUUID(), userId, templateId, installedAt: new Date() };
      installs.push(row);
      return row;
    },
    delete: async (userId, templateId) => {
      const index = installs.findIndex(
        (i) => i.userId === userId && i.templateId === templateId,
      );
      installs.splice(index, 1);
    },
    listByUser: async () => ({ items: [], total: 0, page: 1, limit: 20 }),
  };

  const reviewRepo: ReviewRepository = {
    findById: async (id) => reviews.get(id) ?? null,
    findByUserAndTemplate: async (userId, templateId) =>
      [...reviews.values()].find((r) => r.userId === userId && r.templateId === templateId) ??
      null,
    create: async (data) => {
      const row: ReviewWithUser = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: data.userId, displayName: "U" },
      };
      reviews.set(row.id, row);
      return row;
    },
    update: async (id, changes) => {
      const row = { ...reviews.get(id)!, ...changes } as ReviewWithUser;
      reviews.set(id, row);
      return row;
    },
    delete: async (id) => {
      reviews.delete(id);
    },
    listByTemplate: async () => ({ items: [], total: 0, page: 1, limit: 20 }),
  };

  const published: { event: string; payload: unknown }[] = [];
  const events: EventPublisher = {
    publish: (event, payload) => {
      published.push({ event, payload });
    },
  };

  const add = (status: TemplateDetails["status"]) => {
    const template = makeTemplate(status);
    templates.set(template.id, template);
    return template;
  };

  return {
    add,
    installs,
    published,
    installations: createInstallationService(installationRepo, templateRepo, events),
    reviews: createReviewService(reviewRepo, installationRepo, templateRepo, events),
  };
};

describe("InstallationService", () => {
  let fakes: ReturnType<typeof createFakes>;
  beforeEach(() => {
    fakes = createFakes();
  });

  it("installs a published template", async () => {
    const template = fakes.add("PUBLISHED");
    const installation = await fakes.installations.install(user.id, template.id);
    expect(installation.templateId).toBe(template.id);
    expect(fakes.published).toEqual([
      { event: "template.installed", payload: { templateId: template.id, userId: user.id } },
    ]);
  });

  it("refuses to install drafts and archived templates", async () => {
    for (const status of ["DRAFT", "ARCHIVED"] as const) {
      const template = fakes.add(status);
      await expect(fakes.installations.install(user.id, template.id)).rejects.toBeInstanceOf(
        BusinessRuleError,
      );
    }
    expect(fakes.published).toEqual([]);
  });

  it("refuses to install the same template twice", async () => {
    const template = fakes.add("PUBLISHED");
    await fakes.installations.install(user.id, template.id);
    await expect(fakes.installations.install(user.id, template.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("returns NotFoundError when uninstalling something not installed", async () => {
    const template = fakes.add("PUBLISHED");
    await expect(fakes.installations.uninstall(user.id, template.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("ReviewService", () => {
  let fakes: ReturnType<typeof createFakes>;
  beforeEach(() => {
    fakes = createFakes();
  });

  const installed = async () => {
    const template = fakes.add("PUBLISHED");
    await fakes.installations.install(user.id, template.id);
    return template;
  };

  it("lets a user review an installed template", async () => {
    const template = await installed();
    const review = await fakes.reviews.create(user, template.id, { rating: 5, comment: " Great " });
    expect(review).toMatchObject({ rating: 5, comment: "Great" });
    expect(fakes.published[fakes.published.length - 1]).toEqual({
      event: "review.created",
      payload: { templateId: template.id, reviewId: review.id },
    });
  });

  it("requires installation before reviewing", async () => {
    const template = fakes.add("PUBLISHED");
    await expect(fakes.reviews.create(user, template.id, { rating: 4 })).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("forbids reviewing own template", async () => {
    const template = fakes.add("PUBLISHED");
    await fakes.installations.install(authorId, template.id);
    await expect(
      fakes.reviews.create({ id: authorId, role: "USER" }, template.id, { rating: 5 }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it("allows only one review per template", async () => {
    const template = await installed();
    await fakes.reviews.create(user, template.id, { rating: 3 });
    await expect(fakes.reviews.create(user, template.id, { rating: 5 })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("lets only the owner edit and owner or admin delete", async () => {
    const template = await installed();
    const review = await fakes.reviews.create(user, template.id, { rating: 3 });

    await expect(
      fakes.reviews.update(otherUser, review.id, { rating: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(fakes.reviews.update(admin, review.id, { rating: 1 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(fakes.reviews.remove(otherUser, review.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect((await fakes.reviews.remove(admin, review.id)).id).toBe(review.id);
  });
});
