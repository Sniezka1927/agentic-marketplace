import type { Template } from "./types";

export const authorName = (template: Template) =>
  template.author?.displayName ?? template.externalAuthor ?? "Unknown";

export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
    : "—";
