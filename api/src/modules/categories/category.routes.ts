import { Elysia, t } from "elysia";
import { ErrorResponse, IdParams } from "../../common/schemas";
import {
  CategoryDto,
  CreateCategoryBody,
  UpdateCategoryBody,
  toCategoryDto,
} from "./category.dto";
import type { CategoryService } from "./category.service";

export const categoryRoutes = (service: CategoryService) =>
  new Elysia({ prefix: "/categories", detail: { tags: ["Categories"] } })
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
        body: CreateCategoryBody,
        response: { 201: CategoryDto, 409: ErrorResponse, 422: ErrorResponse },
        detail: { summary: "Create category" },
      },
    )
    .patch(
      "/:id",
      async ({ params, body }) =>
        toCategoryDto(await service.update(params.id, body)),
      {
        params: IdParams,
        body: UpdateCategoryBody,
        response: {
          200: CategoryDto,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Update category" },
      },
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        await service.remove(params.id);
        return status(204, undefined);
      },
      {
        params: IdParams,
        response: { 204: t.Void(), 404: ErrorResponse, 409: ErrorResponse },
        detail: { summary: "Delete category" },
      },
    );
