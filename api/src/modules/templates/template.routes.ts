import { Elysia, t } from "elysia";
import { Paginated, toPageRequest } from "../../common/pagination";
import { ErrorResponse, IdParams } from "../../common/schemas";
import type { AuthGuard } from "../auth/auth.guard";
import {
  CreateTemplateBody,
  OwnTemplateListQuery,
  TemplateDto,
  TemplateListQuery,
  UpdateTemplateBody,
  toTemplateDto,
} from "./template.dto";
import type { TemplateService } from "./template.service";

const security = [{ bearerAuth: [] }];

const toPageDto = <T extends { items: Parameters<typeof toTemplateDto>[0][] }>(page: T) => ({
  ...page,
  items: page.items.map(toTemplateDto),
});

const writeErrors = {
  401: ErrorResponse,
  403: ErrorResponse,
  404: ErrorResponse,
  409: ErrorResponse,
  422: ErrorResponse,
};

export const templateRoutes = (service: TemplateService, guard: AuthGuard) =>
  new Elysia({ prefix: "/templates", detail: { tags: ["Templates"] } })
    .use(guard)
    .get(
      "/",
      async ({ query }) =>
        toPageDto(await service.listPublished({ ...query, ...toPageRequest(query) })),
      {
        query: TemplateListQuery,
        response: { 200: Paginated(TemplateDto), 422: ErrorResponse },
        detail: { summary: "List published templates (search, filter by category, sort, paginate)" },
      },
    )
    .get(
      "/mine",
      async ({ user, query }) =>
        toPageDto(await service.listOwn(user, { ...query, ...toPageRequest(query) })),
      {
        auth: true,
        query: OwnTemplateListQuery,
        response: { 200: Paginated(TemplateDto), 401: ErrorResponse, 422: ErrorResponse },
        detail: { summary: "List own templates in any status", security },
      },
    )
    .get(
      "/:id",
      async ({ viewer, params }) => toTemplateDto(await service.get(params.id, viewer)),
      {
        optionalAuth: true,
        params: IdParams,
        response: { 200: TemplateDto, 401: ErrorResponse, 404: ErrorResponse },
        detail: {
          summary: "Get template (drafts and archived only for author or admin)",
        },
      },
    )
    .post(
      "/",
      async ({ user, body, status }) =>
        status(201, toTemplateDto(await service.create(user, body))),
      {
        auth: true,
        body: CreateTemplateBody,
        response: { 201: TemplateDto, ...writeErrors },
        detail: { summary: "Create template as draft", security },
      },
    )
    .patch(
      "/:id",
      async ({ user, params, body }) =>
        toTemplateDto(await service.update(user, params.id, body)),
      {
        auth: true,
        params: IdParams,
        body: UpdateTemplateBody,
        response: { 200: TemplateDto, ...writeErrors },
        detail: {
          summary: "Update template (author or admin, optimistic locking by version)",
          security,
        },
      },
    )
    .post(
      "/:id/publish",
      async ({ user, params }) => toTemplateDto(await service.publish(user, params.id)),
      {
        auth: true,
        params: IdParams,
        response: { 200: TemplateDto, ...writeErrors },
        detail: { summary: "Publish template", security },
      },
    )
    .post(
      "/:id/archive",
      async ({ user, params }) => toTemplateDto(await service.archive(user, params.id)),
      {
        auth: true,
        params: IdParams,
        response: { 200: TemplateDto, ...writeErrors },
        detail: { summary: "Archive template", security },
      },
    )
    .delete(
      "/:id",
      async ({ user, params, status }) => {
        await service.remove(user, params.id);
        return status(204, undefined);
      },
      {
        auth: true,
        params: IdParams,
        response: { 204: t.Void(), ...writeErrors },
        detail: { summary: "Delete template without installations", security },
      },
    );
