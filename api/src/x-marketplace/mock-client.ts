import { toAgent } from "./mapper";
import type { MarketplaceClient, XBot } from "./types";

export const mockBots: XBot[] = [
  {
    id: "SeMqhg9bPD4Qd_8i7I-vN",
    name: "New Bot",
    description:
      "A warm, concise desktop assistant for files, spreadsheets, lookups, drafts, and light automation.",
    author: "Aleksander",
  },
];

export function createMockClient(bots: XBot[] = mockBots): MarketplaceClient {
  return {
    async listAgents({ page, limit, q, author }) {
      const needle = q?.toLowerCase();
      const filtered = bots.filter(
        (bot) =>
          (!needle ||
            bot.name.toLowerCase().includes(needle) ||
            bot.description.toLowerCase().includes(needle)) &&
          (!author || bot.author.toLowerCase() === author.toLowerCase()),
      );
      const start = (page - 1) * limit;

      return {
        items: filtered.slice(start, start + limit).map(toAgent),
        page,
        limit,
        total: filtered.length,
      };
    },

    async getAgent(id) {
      const bot = bots.find((b) => b.id === id);
      return bot ? toAgent(bot) : null;
    },
  };
}
