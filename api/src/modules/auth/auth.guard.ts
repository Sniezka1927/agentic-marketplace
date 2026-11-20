import { Elysia } from "elysia";
import { ForbiddenError, UnauthorizedError } from "../../common/errors";
import type { Role, User } from "../users/user.repository";
import type { AuthService } from "./auth.service";

const BEARER = "Bearer ";

export const createAuthGuard = (authService: AuthService) => {
  const userFromHeader = (header: string) => {
    if (!header.startsWith(BEARER)) throw new UnauthorizedError();
    return authService.authenticate(header.slice(BEARER.length));
  };

  return new Elysia({ name: "auth-guard" }).macro({
    auth: (roles: true | Role[]) => ({
      transform({ headers }) {
        if (!headers.authorization) throw new UnauthorizedError();
      },
      async resolve({ headers }) {
        if (!headers.authorization) throw new UnauthorizedError();
        const user = await userFromHeader(headers.authorization);
        if (Array.isArray(roles) && !roles.includes(user.role)) {
          throw new ForbiddenError();
        }
        return { user };
      },
    }),
    optionalAuth: (enabled: boolean) => ({
      async resolve({ headers }) {
        const viewer: User | null =
          enabled && headers.authorization
            ? await userFromHeader(headers.authorization)
            : null;
        return { viewer };
      },
    }),
  });
};

export type AuthGuard = ReturnType<typeof createAuthGuard>;
