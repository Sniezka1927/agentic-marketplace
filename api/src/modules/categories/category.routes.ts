import { Elysia, t } from "elysia";
import { ErrorResponse, IdParams } from "../../common/schemas";
import {
  CategoryDto,
  CreateCategoryBody,
  UpdateCategoryBody,
  toCategoryDto,
} from "./category.dto";
import type { AuthGuard } from "../auth/auth.guard";
import type { CategoryService } from "./category.service";

export const categoryRoutes = (service: CategoryService, guard: AuthGuard) =>
  new Elysia({ prefix: "/categories", detail: { tags: ["Categories"] } })
    .use(guard)
    .get("/", async () => (await service.list()).map(toCategoryDto), {
      response: t.Array(CategoryDto),
      detail: { summary: "List categories" },
    })
    .get("/:id", async ({ params }) => toCategoryDto(await service.get(params.id)), {
      params: IdParams,
      response: { 200: CategoryDto, 404: ErrorResponse },
      detail: { summary: "Get category" },
    })
    .post(
      "/",
      async ({ body, status }) =>
        status(201, toCategoryDto(await service.create(body))),
      {
        auth: ["ADMIN"],
        body: CreateCategoryBody,
        response: {
          201: CategoryDto,
          401: ErrorResponse,
          403: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Create category (admin)", security: [{ bearerAuth: [] }] },
      },
    )
    .patch(
      "/:id",
      async ({ params, body }) =>
        toCategoryDto(await service.update(params.id, body)),
      {
        auth: ["ADMIN"],
        params: IdParams,
        body: UpdateCategoryBody,
        response: {
          200: CategoryDto,
          401: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Update category (admin)", security: [{ bearerAuth: [] }] },
      },
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        await service.remove(params.id);
        return status(204, undefined);
      },
      {
        auth: ["ADMIN"],
        params: IdParams,
        response: {
          204: t.Void(),
          401: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
        },
        detail: { summary: "Delete category (admin)", security: [{ bearerAuth: [] }] },
      },
    );
