import { Elysia } from "elysia";
import { ForbiddenError, UnauthorizedError } from "../../common/errors";
import type { Role } from "../users/user.repository";
import type { AuthService } from "./auth.service";

export const createAuthGuard = (authService: AuthService) =>
  new Elysia({ name: "auth-guard" }).macro({
    auth: (roles: true | Role[]) => ({
      async resolve({ headers }) {
        const header = headers.authorization;
        if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
        const user = await authService.authenticate(header.slice("Bearer ".length));
        if (Array.isArray(roles) && !roles.includes(user.role)) {
          throw new ForbiddenError();
        }
        return { user };
      },
    }),
  });

export type AuthGuard = ReturnType<typeof createAuthGuard>;
