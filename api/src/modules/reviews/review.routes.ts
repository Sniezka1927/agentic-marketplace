import { Elysia, t } from "elysia";
import { PaginationQuery, Paginated, toPageRequest } from "../../common/pagination";
import { ErrorResponse, IdParams } from "../../common/schemas";
import type { AuthGuard } from "../auth/auth.guard";
import { CreateReviewBody, ReviewDto, UpdateReviewBody, toReviewDto } from "./review.dto";
import type { ReviewService } from "./review.service";

const security = [{ bearerAuth: [] }];

export const reviewRoutes = (service: ReviewService, guard: AuthGuard) =>
  new Elysia({ detail: { tags: ["Reviews"] } })
    .use(guard)
    .get(
      "/templates/:id/reviews",
      async ({ viewer, params, query }) => {
        const page = await service.listForTemplate(params.id, viewer, toPageRequest(query));
        return { ...page, items: page.items.map(toReviewDto) };
      },
      {
        optionalAuth: true,
        params: IdParams,
        query: PaginationQuery,
        response: { 200: Paginated(ReviewDto), 404: ErrorResponse },
        detail: { summary: "List reviews of a template" },
      },
    )
    .post(
      "/templates/:id/reviews",
      async ({ user, params, body, status }) =>
        status(201, toReviewDto(await service.create(user, params.id, body))),
      {
        auth: true,
        params: IdParams,
        body: CreateReviewBody,
        response: {
          201: ReviewDto,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: {
          summary: "Review an installed template (not your own, once per template)",
          security,
        },
      },
    )
    .patch(
      "/reviews/:id",
      async ({ user, params, body }) =>
        toReviewDto(await service.update(user, params.id, body)),
      {
        auth: true,
        params: IdParams,
        body: UpdateReviewBody,
        response: {
          200: ReviewDto,
          401: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Update own review", security },
      },
    )
    .delete(
      "/reviews/:id",
      async ({ user, params, status }) => {
        await service.remove(user, params.id);
        return status(204, undefined);
      },
      {
        auth: true,
        params: IdParams,
        response: { 204: t.Void(), 401: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse },
        detail: { summary: "Delete own review (admin: any review)", security },
      },
    );
