import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { config } from "./config";
import { agentsRoutes } from "./routes/agents";
import {
  createMarketplaceClient,
  type MarketplaceClient,
} from "./x-marketplace";

export const createApp = (
  client: MarketplaceClient = createMarketplaceClient(config.xMarketplace),
) =>
  new Elysia()
    .use(cors({ origin: config.corsOrigin }))
    .get("/", () => "Agentic Marketplace API")
    .use(agentsRoutes(client));

export const app = createApp();
