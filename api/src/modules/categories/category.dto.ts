import { t, type Static } from "elysia";
import type { Category } from "./category.repository";

export const CategoryDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  slug: t.String(),
  description: t.String(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const CreateCategoryBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  slug: t.Optional(
    t.String({ minLength: 2, maxLength: 100, pattern: "^[a-z0-9-]+$" }),
  ),
  description: t.Optional(t.String({ maxLength: 1000 })),
});

export const UpdateCategoryBody = t.Partial(CreateCategoryBody, {
  minProperties: 1,
});

export const toCategoryDto = (category: Category): Static<typeof CategoryDto> => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
});
