import { ConflictError, NotFoundError } from "../../common/errors";
import { slugify } from "../../common/slug";
import type { Category, CategoryRepository } from "./category.repository";

export type CreateCategoryInput = {
  name: string;
  slug?: string;
  description?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const createCategoryService = (repo: CategoryRepository) => {
  const get = async (id: string): Promise<Category> => {
    const category = await repo.findById(id);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  };

  const ensureSlugFree = async (slug: string, currentId?: string) => {
    const existing = await repo.findBySlug(slug);
    if (existing && existing.id !== currentId) {
      throw new ConflictError(`Category with slug "${slug}" already exists`);
    }
  };

  return {
    list: () => repo.findAll(),

    get,

    async create(input: CreateCategoryInput) {
      const slug = slugify(input.slug ?? input.name);
      await ensureSlugFree(slug);
      return repo.create({
        name: input.name.trim(),
        slug,
        description: input.description ?? "",
      });
    },

    async update(id: string, input: UpdateCategoryInput) {
      await get(id);
      const slug = input.slug !== undefined ? slugify(input.slug) : undefined;
      if (slug) await ensureSlugFree(slug, id);
      return repo.update(id, {
        name: input.name?.trim(),
        slug,
        description: input.description,
      });
    },

    async remove(id: string) {
      await get(id);
      if ((await repo.countTemplates(id)) > 0) {
        throw new ConflictError("Category has templates and cannot be deleted");
      }
      await repo.delete(id);
    },
  };
};

export type CategoryService = ReturnType<typeof createCategoryService>;
