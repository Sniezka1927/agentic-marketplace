import { toAgent } from "./mapper";
import {
  UpstreamError,
  type MarketplaceClient,
  type XBot,
  type XBotPage,
} from "./types";

export function createHttpClient(
  baseUrl: string,
  token: string,
): MarketplaceClient {
  const root = baseUrl.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${token}` };

  return {
    async listAgents(query) {
      const url = new URL(`${root}/bots`);
      url.searchParams.set("page", String(query.page));
      url.searchParams.set("limit", String(query.limit));
      if (query.q) url.searchParams.set("q", query.q);
      if (query.author) url.searchParams.set("author", query.author);

      const res = await fetch(url, { headers });
      if (!res.ok) throw new UpstreamError(res.status);
      const body = (await res.json()) as XBotPage;

      return {
        items: body.bots.map(toAgent),
        page: query.page,
        limit: query.limit,
        total: body.total,
      };
    },

    async getAgent(id) {
      const res = await fetch(`${root}/bots/${encodeURIComponent(id)}`, {
        headers,
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new UpstreamError(res.status);
      return toAgent((await res.json()) as XBot);
    },
  };
}
