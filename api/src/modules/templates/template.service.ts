import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors";
import type { PageRequest } from "../../common/pagination";
import type { CategoryRepository } from "../categories/category.repository";
import { parseXBotUrl } from "../../x/bot-link";
import type { User } from "../users/user.repository";
import type {
  TemplateChanges,
  TemplateDetails,
  TemplateFilter,
  TemplateRepository,
} from "./template.repository";

export const MIN_PUBLISH_DESCRIPTION_LENGTH = 20;

export type CreateTemplateInput = {
  name: string;
  description?: string;
  xUrl: string;
  categoryId: string;
};

export type UpdateTemplateInput = Partial<CreateTemplateInput> & { version: number };

type Viewer = Pick<User, "id" | "role">;

export const canManage = (viewer: Viewer | null, template: TemplateDetails) =>
  viewer !== null && (viewer.role === "ADMIN" || template.authorId === viewer.id);

export const createTemplateService = (
  repo: TemplateRepository,
  categories: CategoryRepository,
) => {
  const findVisible = async (id: string, viewer: Viewer | null) => {
    const template = await repo.findById(id);
    if (!template || (template.status !== "PUBLISHED" && !canManage(viewer, template))) {
      throw new NotFoundError("Template not found");
    }
    return template;
  };

  const findManageable = async (id: string, viewer: Viewer) => {
    const template = await findVisible(id, viewer);
    if (!canManage(viewer, template)) {
      throw new ForbiddenError("Only the author or an admin can modify this template");
    }
    return template;
  };

  const ensureCategory = async (categoryId: string) => {
    if (!(await categories.findById(categoryId))) {
      throw new BusinessRuleError("Category does not exist");
    }
  };

  const resolveBotId = async (xUrl: string, currentId?: string) => {
    const botId = parseXBotUrl(xUrl);
    if (!botId) {
      throw new BusinessRuleError("Provide a link to an x.ai bot, e.g. https://x.ai/bot/<id>");
    }
    const existing = await repo.findByExternalId(botId);
    if (existing && existing.id !== currentId) {
      throw new ConflictError("This x.ai bot is already listed in the marketplace");
    }
    return botId;
  };

  const save = async (template: TemplateDetails, version: number, changes: TemplateChanges) => {
    const updated = await repo.update(template.id, version, changes);
    if (!updated) {
      throw new ConflictError(
        "Template was modified by someone else, reload it and try again",
      );
    }
    return updated;
  };

  return {
    listPublished: (query: PageRequest & Omit<TemplateFilter, "status" | "authorId">) =>
      repo.list({ ...query, status: "PUBLISHED" }),

    listOwn: (viewer: Viewer, query: PageRequest & Omit<TemplateFilter, "authorId">) =>
      repo.list({ ...query, authorId: viewer.id }),

    get: findVisible,

    async create(viewer: Viewer, input: CreateTemplateInput) {
      await ensureCategory(input.categoryId);
      const externalId = await resolveBotId(input.xUrl);
      return repo.create({
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        externalId,
        categoryId: input.categoryId,
        authorId: viewer.id,
        status: "DRAFT",
      });
    },

    async update(viewer: Viewer, id: string, { version, ...input }: UpdateTemplateInput) {
      const template = await findManageable(id, viewer);
      if (input.categoryId && input.categoryId !== template.categoryId) {
        await ensureCategory(input.categoryId);
      }
      const description = input.description?.trim();
      if (
        template.status === "PUBLISHED" &&
        description !== undefined &&
        description.length < MIN_PUBLISH_DESCRIPTION_LENGTH
      ) {
        throw new BusinessRuleError(
          `Published template needs a description of at least ${MIN_PUBLISH_DESCRIPTION_LENGTH} characters`,
        );
      }
      const externalId =
        input.xUrl !== undefined ? await resolveBotId(input.xUrl, template.id) : undefined;
      return save(template, version, {
        name: input.name?.trim(),
        description,
        externalId,
        categoryId: input.categoryId,
      });
    },

    async publish(viewer: Viewer, id: string) {
      const template = await findManageable(id, viewer);
      if (template.status === "PUBLISHED") {
        throw new BusinessRuleError("Template is already published");
      }
      if (template.description.length < MIN_PUBLISH_DESCRIPTION_LENGTH) {
        throw new BusinessRuleError(
          `Template needs a description of at least ${MIN_PUBLISH_DESCRIPTION_LENGTH} characters to be published`,
        );
      }
      return save(template, template.version, {
        status: "PUBLISHED",
        publishedAt: template.publishedAt ?? new Date(),
      });
    },

    async archive(viewer: Viewer, id: string) {
      const template = await findManageable(id, viewer);
      if (template.status === "ARCHIVED") {
        throw new BusinessRuleError("Template is already archived");
      }
      return save(template, template.version, { status: "ARCHIVED" });
    },

    async remove(viewer: Viewer, id: string) {
      const template = await findManageable(id, viewer);
      if ((await repo.countInstallations(template.id)) > 0) {
        throw new ConflictError(
          "Template has installations and cannot be deleted, archive it instead",
        );
      }
      await repo.delete(template.id);
    },
  };
};

export type TemplateService = ReturnType<typeof createTemplateService>;
