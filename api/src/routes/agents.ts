import { Elysia, t } from "elysia";
import { UpstreamError, type MarketplaceClient } from "../x-marketplace";

export const agentsRoutes = (client: MarketplaceClient) =>
  new Elysia({ prefix: "/agents" })
    .onError(({ error, status }) => {
      if (error instanceof UpstreamError) {
        return status(502, { message: "X marketplace unavailable" });
      }
    })
    .get(
      "/",
      ({ query }) =>
        client.listAgents({
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          q: query.q,
          author: query.author,
        }),
      {
        query: t.Object({
          page: t.Optional(t.Numeric({ minimum: 1 })),
          limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
          q: t.Optional(t.String()),
          author: t.Optional(t.String()),
        }),
      },
    )
    .get(
      "/:id",
      async ({ params, status }) => {
        const agent = await client.getAgent(params.id);
        return agent ?? status(404, { message: "Agent not found" });
      },
      { params: t.Object({ id: t.String() }) },
    );
