import { t, type Static } from "elysia";
import { PaginationQuery } from "../../common/pagination";
import { X_BOT_URL_PATTERN, grokBotInstallUrl, xBotPageUrl } from "../../x/bot-link";
import type { TemplateDetails } from "./template.repository";

export const TemplateStatusSchema = t.UnionEnum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const XBotUrl = t.String({
  pattern: X_BOT_URL_PATTERN,
  maxLength: 300,
  description: "Link to the bot on x.ai, e.g. https://x.ai/bot/SeMqhg9bPD4Qd_8i7I-vN",
});

export const TemplateDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.String(),
  botId: t.String(),
  xUrl: t.String({ description: "Bot page on x.ai" }),
  installUrl: t.String({ description: "Grok Bot deeplink, same as Add to Grok Bot on x.ai" }),
  status: TemplateStatusSchema,
  author: t.Nullable(t.Object({ id: t.String(), displayName: t.String() })),
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
  xUrl: XBotUrl,
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
  botId: template.externalId,
  xUrl: xBotPageUrl(template.externalId),
  installUrl: grokBotInstallUrl(template.externalId),
  status: template.status,
  author: template.author,
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
