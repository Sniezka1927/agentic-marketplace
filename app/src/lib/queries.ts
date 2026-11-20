"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import type {
  Category,
  Installation,
  Page,
  Review,
  Template,
  TemplateSort,
} from "./types";

export type TemplateListParams = {
  page: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  sort?: TemplateSort;
};

export const keys = {
  categories: ["categories"] as const,
  templates: (params: object) => ["templates", "list", params] as const,
  template: (id: string) => ["templates", "detail", id] as const,
  installation: (id: string) => ["installations", "template", id] as const,
  reviews: (id: string, page: number) => ["reviews", id, page] as const,
};

export const useCategories = () =>
  useQuery({
    queryKey: keys.categories,
    queryFn: () => api<Category[]>("/categories"),
    staleTime: 5 * 60_000,
  });

export const useTemplates = (params: TemplateListParams) =>
  useQuery({
    queryKey: keys.templates(params),
    queryFn: () => api<Page<Template>>("/templates", { query: params }),
    placeholderData: (previous) => previous,
  });

export const useTemplate = (id: string) =>
  useQuery({
    queryKey: keys.template(id),
    queryFn: () => api<Template>(`/templates/${id}`),
  });

export const useOwnInstallation = (templateId: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.installation(templateId),
    queryFn: async () => {
      try {
        return await api<Installation>(`/templates/${templateId}/install`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled,
  });

export const useReviews = (templateId: string, page: number) =>
  useQuery({
    queryKey: keys.reviews(templateId, page),
    queryFn: () =>
      api<Page<Review>>(`/templates/${templateId}/reviews`, { query: { page, limit: 10 } }),
    placeholderData: (previous) => previous,
  });

const STATS_REFRESH_DELAY_MS = 500;

const useInvalidateTemplate = () => {
  const queryClient = useQueryClient();
  return (templateId: string) => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: keys.template(templateId) });
      queryClient.invalidateQueries({ queryKey: ["templates", "list"] });
    };
    refresh();
    setTimeout(refresh, STATS_REFRESH_DELAY_MS);
  };
};

export const useInstallToggle = (templateId: string) => {
  const queryClient = useQueryClient();
  const invalidateTemplate = useInvalidateTemplate();
  return useMutation({
    mutationFn: async (installed: boolean) => {
      await api(`/templates/${templateId}/install`, { method: installed ? "DELETE" : "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      invalidateTemplate(templateId);
    },
  });
};

export const useReviewMutations = (templateId: string) => {
  const queryClient = useQueryClient();
  const invalidateTemplate = useInvalidateTemplate();
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", templateId] });
    invalidateTemplate(templateId);
  };

  return {
    create: useMutation({
      mutationFn: (input: { rating: number; comment: string }) =>
        api<Review>(`/templates/${templateId}/reviews`, { method: "POST", body: input }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string; rating: number; comment: string }) =>
        api<Review>(`/reviews/${id}`, { method: "PATCH", body: input }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/reviews/${id}`, { method: "DELETE" }),
      onSuccess,
    }),
  };
};
