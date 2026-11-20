import { Elysia, t } from "elysia";
import { PaginationQuery, Paginated, toPageRequest } from "../../common/pagination";
import { ErrorResponse, IdParams } from "../../common/schemas";
import type { AuthGuard } from "../auth/auth.guard";
import {
  InstallationDto,
  InstallationWithTemplateDto,
  toInstallationDto,
  toInstallationWithTemplateDto,
} from "./installation.dto";
import type { InstallationService } from "./installation.service";

const security = [{ bearerAuth: [] }];

export const installationRoutes = (service: InstallationService, guard: AuthGuard) =>
  new Elysia({ detail: { tags: ["Installations"] } })
    .use(guard)
    .post(
      "/templates/:id/install",
      async ({ user, params, status }) =>
        status(201, toInstallationDto(await service.install(user.id, params.id))),
      {
        auth: true,
        params: IdParams,
        response: {
          201: InstallationDto,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Install a published template", security },
      },
    )
    .get(
      "/templates/:id/install",
      async ({ user, params }) => toInstallationDto(await service.getOwn(user.id, params.id)),
      {
        auth: true,
        params: IdParams,
        response: { 200: InstallationDto, 401: ErrorResponse, 404: ErrorResponse },
        detail: { summary: "Get own installation of a template (404 if not installed)", security },
      },
    )
    .delete(
      "/templates/:id/install",
      async ({ user, params, status }) => {
        await service.uninstall(user.id, params.id);
        return status(204, undefined);
      },
      {
        auth: true,
        params: IdParams,
        response: { 204: t.Void(), 401: ErrorResponse, 404: ErrorResponse },
        detail: { summary: "Uninstall a template", security },
      },
    )
    .get(
      "/installations/mine",
      async ({ user, query }) => {
        const page = await service.listOwn(user.id, toPageRequest(query));
        return { ...page, items: page.items.map(toInstallationWithTemplateDto) };
      },
      {
        auth: true,
        query: PaginationQuery,
        response: { 200: Paginated(InstallationWithTemplateDto), 401: ErrorResponse },
        detail: { summary: "List own installed templates", security },
      },
    );
