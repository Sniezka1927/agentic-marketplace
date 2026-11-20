import { tokenStore } from "./token-store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ApiErrorDetail = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
};

const buildUrl = (path: string, query?: RequestOptions["query"]) => {
  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the API. Is it running?");
  }

  if (res.status === 401 && token) tokenStore.set(null);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.details ?? [],
    );
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.details.length > 0) {
      return error.details
        .map((d) => (d.path ? `${d.path.replace(/^\//, "")}: ${d.message}` : d.message))
        .join("\n");
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};
