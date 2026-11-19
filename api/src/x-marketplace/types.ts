export type XBot = {
  id: string;
  name: string;
  description: string;
  author: string;
};

export type XBotPage = {
  bots: XBot[];
  total: number;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  author: string;
  pageUrl: string;
  templateUrl: string;
};

export type AgentQuery = {
  page: number;
  limit: number;
  q?: string;
  author?: string;
};

export type AgentPage = {
  items: Agent[];
  page: number;
  limit: number;
  total: number;
};

export interface MarketplaceClient {
  listAgents(query: AgentQuery): Promise<AgentPage>;
  getAgent(id: string): Promise<Agent | null>;
}

export class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`X marketplace responded with ${status}`);
  }
}
