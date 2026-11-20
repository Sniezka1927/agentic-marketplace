export const X_BOT_URL_PATTERN = "^https://(www\\.)?x\\.ai/bot/[A-Za-z0-9_-]{1,100}/?(\\?.*)?$";

const X_BOT_URL = /^https:\/\/(?:www\.)?x\.ai\/bot\/([A-Za-z0-9_-]{1,100})\/?(?:\?.*)?$/;

export const parseXBotUrl = (url: string): string | null =>
  X_BOT_URL.exec(url.trim())?.[1] ?? null;

export const xBotPageUrl = (botId: string) => `https://x.ai/bot/${botId}`;

export const grokBotInstallUrl = (botId: string) =>
  `grokbot://app/v1/bot-template?id=${encodeURIComponent(botId)}`;
