import { t, type TSchema } from "elysia";

export const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export type PageRequest = { page: number; limit: number };

export type Page<T> = PageRequest & { items: T[]; total: number };

export const toPageRequest = (query: {
  page?: number;
  limit?: number;
}): PageRequest => ({ page: query.page ?? 1, limit: query.limit ?? 20 });

export const offsetOf = ({ page, limit }: PageRequest) => (page - 1) * limit;

export const Paginated = <T extends TSchema>(item: T) =>
  t.Object({
    items: t.Array(item),
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
  });
