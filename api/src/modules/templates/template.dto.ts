import { t, type Static } from "elysia";
import { PaginationQuery } from "../../common/pagination";
import type { TemplateDetails } from "./template.repository";

export const TemplateStatusSchema = t.UnionEnum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const TemplateSourceSchema = t.UnionEnum(["LOCAL", "X"]);

const TemplateUrl = t.String({
  pattern: "^(grokbot|https)://\\S+$",
  maxLength: 2048,
  description: "grokbot:// install link or https:// URL",
});

export const TemplateDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.String(),
  templateUrl: t.String(),
  status: TemplateStatusSchema,
  source: TemplateSourceSchema,
  author: t.Nullable(t.Object({ id: t.String(), displayName: t.String() })),
  externalAuthor: t.Nullable(t.String()),
  category: t.Object({ id: t.String(), name: t.String(), slug: t.String() }),
  version: t.Integer(),
  installsCount: t.Integer(),
  ratingAvg: t.Number(),
  ratingCount: t.Integer(),
  publishedAt: t.Nullable(t.String({ format: "date-time" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const CreateTemplateBody = t.Object({
  name: t.String({ minLength: 3, maxLength: 120 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
  templateUrl: TemplateUrl,
  categoryId: t.String({ format: "uuid" }),
});

export const UpdateTemplateBody = t.Composite([
  t.Partial(CreateTemplateBody),
  t.Object({ version: t.Integer({ minimum: 1 }) }),
]);

const literals = <T extends string>(values: readonly T[]) =>
  t.Union(values.map((value) => t.Literal(value)));

const filters = {
  q: t.Optional(t.String({ maxLength: 100 })),
  categoryId: t.Optional(t.String({ format: "uuid" })),
  source: t.Optional(literals(["LOCAL", "X"] as const)),
  sort: t.Optional(literals(["newest", "popular", "rating", "name"] as const)),
};

export const TemplateListQuery = t.Composite([PaginationQuery, t.Object(filters)]);

export const OwnTemplateListQuery = t.Composite([
  PaginationQuery,
  t.Object({
    ...filters,
    status: t.Optional(literals(["DRAFT", "PUBLISHED", "ARCHIVED"] as const)),
  }),
]);

export const toTemplateDto = (template: TemplateDetails): Static<typeof TemplateDto> => ({
  id: template.id,
  name: template.name,
  description: template.description,
  templateUrl: template.templateUrl,
  status: template.status,
  source: template.source,
  author: template.author,
  externalAuthor: template.externalAuthor,
  category: {
    id: template.category.id,
    name: template.category.name,
    slug: template.category.slug,
  },
  version: template.version,
  installsCount: template.installsCount,
  ratingAvg: template.ratingAvg,
  ratingCount: template.ratingCount,
  publishedAt: template.publishedAt?.toISOString() ?? null,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
});
