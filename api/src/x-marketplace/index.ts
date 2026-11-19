import { createHttpClient } from "./http-client";
import { createMockClient } from "./mock-client";
import type { MarketplaceClient } from "./types";

export * from "./types";
export { createHttpClient, createMockClient };

export function createMarketplaceClient(options: {
  url: string;
  token: string;
}): MarketplaceClient {
  return options.url && options.token
    ? createHttpClient(options.url, options.token)
    : createMockClient();
}
