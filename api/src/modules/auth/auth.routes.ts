import { Elysia } from "elysia";
import { ErrorResponse } from "../../common/schemas";
import { UserDto, toUserDto } from "../users/user.dto";
import { AuthResponse, LoginBody, RegisterBody } from "./auth.dto";
import type { AuthGuard } from "./auth.guard";
import type { AuthService } from "./auth.service";

const toAuthResponse = ({ token, user }: Awaited<ReturnType<AuthService["login"]>>) => ({
  token,
  user: toUserDto(user),
});

export const authRoutes = (service: AuthService, guard: AuthGuard) =>
  new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
    .use(guard)
    .post(
      "/register",
      async ({ body, status }) => status(201, toAuthResponse(await service.register(body))),
      {
        body: RegisterBody,
        response: { 201: AuthResponse, 409: ErrorResponse, 422: ErrorResponse },
        detail: { summary: "Register a new user" },
      },
    )
    .post("/login", async ({ body }) => toAuthResponse(await service.login(body)), {
      body: LoginBody,
      response: { 200: AuthResponse, 401: ErrorResponse, 422: ErrorResponse },
      detail: { summary: "Log in and get a bearer token" },
    })
    .get("/me", ({ user }) => toUserDto(user), {
      auth: true,
      response: { 200: UserDto, 401: ErrorResponse },
      detail: { summary: "Current user", security: [{ bearerAuth: [] }] },
    });
