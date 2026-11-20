import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { errorHandler } from "./common/error-handler";
import { config } from "./config";
import type { Container } from "./container";
import { categoryRoutes } from "./modules/categories/category.routes";
import { agentsRoutes } from "./routes/agents";

export const createApp = (container: Container) =>
  new Elysia()
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
        },
      }),
    )
    .use(errorHandler)
    .get("/", () => "Agentic Marketplace API", { detail: { hide: true } })
    .use(categoryRoutes(container.categoryService))
    .use(agentsRoutes(container.marketplaceClient));

export type App = ReturnType<typeof createApp>;
