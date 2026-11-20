export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
};

export type AuthResponse = { token: string; user: User };

export type Page<T> = { items: T[]; page: number; limit: number; total: number };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type TemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TemplateSort = "newest" | "popular" | "rating" | "name";

export type Template = {
  id: string;
  name: string;
  description: string;
  botId: string;
  xUrl: string;
  installUrl: string;
  status: TemplateStatus;
  author: { id: string; displayName: string } | null;
  category: { id: string; name: string; slug: string };
  version: number;
  installsCount: number;
  ratingAvg: number;
  ratingCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Installation = {
  id: string;
  templateId: string;
  installedAt: string;
};

export type InstallationWithTemplate = Installation & { template: Template };

export type Review = {
  id: string;
  templateId: string;
  rating: number;
  comment: string;
  user: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
};
