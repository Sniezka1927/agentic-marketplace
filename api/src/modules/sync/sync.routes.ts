import { Elysia } from "elysia";
import { PaginationQuery, Paginated, toPageRequest } from "../../common/pagination";
import { ErrorResponse } from "../../common/schemas";
import type { AuthGuard } from "../auth/auth.guard";
import { SyncRunDto, toSyncRunDto } from "./sync.dto";
import type { SyncService } from "./sync.service";

export const syncRoutes = (service: SyncService, guard: AuthGuard) =>
  new Elysia({
    prefix: "/sync",
    detail: { tags: ["X marketplace sync"], security: [{ bearerAuth: [] }] },
  })
    .use(guard)
    .post(
      "/x",
      async ({ user, status }) => {
        const { run } = await service.start(user.id);
        return status(202, toSyncRunDto(run));
      },
      {
        auth: ["ADMIN"],
        response: {
          202: SyncRunDto,
          401: ErrorResponse,
          403: ErrorResponse,
          409: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Start importing bots from X marketplace in the background (admin)" },
      },
    )
    .get(
      "/runs",
      async ({ query }) => {
        const page = await service.listRuns(toPageRequest(query));
        return { ...page, items: page.items.map(toSyncRunDto) };
      },
      {
        auth: ["ADMIN"],
        query: PaginationQuery,
        response: { 200: Paginated(SyncRunDto), 401: ErrorResponse, 403: ErrorResponse },
        detail: { summary: "Synchronization history (admin)" },
      },
    );
