import type { Agent, XBot } from "./types";

export function toAgent(bot: XBot): Agent {
  const id = encodeURIComponent(bot.id);
  return {
    id: bot.id,
    name: bot.name,
    description: bot.description,
    author: bot.author,
    pageUrl: `https://x.ai/bot/${id}`,
    templateUrl: `grokbot://app/v1/bot-template?id=${id}`,
  };
}
