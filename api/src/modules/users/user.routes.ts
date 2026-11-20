import { Elysia, t } from "elysia";
import { PaginationQuery, Paginated, toPageRequest } from "../../common/pagination";
import { ErrorResponse, IdParams } from "../../common/schemas";
import type { AuthGuard } from "../auth/auth.guard";
import { UpdateRoleBody, UserDto, toUserDto } from "./user.dto";
import type { UserService } from "./user.service";

export const userRoutes = (service: UserService, guard: AuthGuard) =>
  new Elysia({
    prefix: "/users",
    detail: { tags: ["Users"], security: [{ bearerAuth: [] }] },
  })
    .use(guard)
    .get(
      "/",
      async ({ query }) => {
        const page = await service.list({ ...toPageRequest(query), q: query.q });
        return { ...page, items: page.items.map(toUserDto) };
      },
      {
        auth: ["ADMIN"],
        query: t.Composite([PaginationQuery, t.Object({ q: t.Optional(t.String()) })]),
        response: { 200: Paginated(UserDto), 401: ErrorResponse, 403: ErrorResponse },
        detail: { summary: "List users (admin)" },
      },
    )
    .patch(
      "/:id/role",
      async ({ user, params, body }) =>
        toUserDto(await service.changeRole(user, params.id, body.role)),
      {
        auth: ["ADMIN"],
        params: IdParams,
        body: UpdateRoleBody,
        response: {
          200: UserDto,
          401: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
        detail: { summary: "Change user role (admin)" },
      },
    );
