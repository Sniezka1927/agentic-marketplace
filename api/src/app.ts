import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { errorHandler } from "./common/error-handler";
import { config } from "./config";
import type { Container } from "./container";
import { createAuthGuard } from "./modules/auth/auth.guard";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { userRoutes } from "./modules/users/user.routes";
import { agentsRoutes } from "./routes/agents";

export const createApp = (container: Container) => {
  const guard = createAuthGuard(container.authService);

  return new Elysia()
    .use(cors({ origin: config.corsOrigin }))
    .use(
      openapi({
        path: "/docs",
        documentation: {
          info: {
            title: "Agentic Marketplace API",
            version: "0.1.0",
            description: "Marketplace of Grok Bot agent templates",
          },
          components: {
            securitySchemes: {
              bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
          },
        },
      }),
    )
    .use(errorHandler)
    .get("/", () => "Agentic Marketplace API", { detail: { hide: true } })
    .use(authRoutes(container.authService, guard))
    .use(userRoutes(container.userService, guard))
    .use(categoryRoutes(container.categoryService, guard))
    .use(agentsRoutes(container.marketplaceClient));
};

export type App = ReturnType<typeof createApp>;
