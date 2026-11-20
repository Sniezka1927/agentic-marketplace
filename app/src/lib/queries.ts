"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError, errorMessage } from "./api";
import type {
  Category,
  Installation,
  InstallationWithTemplate,
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
  installations: (page: number) => ["installations", "mine", page] as const,
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

export const useInstallations = (page: number) =>
  useQuery({
    queryKey: keys.installations(page),
    queryFn: () =>
      api<Page<InstallationWithTemplate>>("/installations/mine", { query: { page, limit: 12 } }),
    placeholderData: (previous) => previous,
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
    onSuccess: (_, wasInstalled) => {
      toast.success(wasInstalled ? "Template uninstalled" : "Template installed");
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      invalidateTemplate(templateId);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
};

export const useReviewMutations = (templateId: string) => {
  const queryClient = useQueryClient();
  const invalidateTemplate = useInvalidateTemplate();
  const onSuccess = (message: string) => () => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["reviews", templateId] });
    invalidateTemplate(templateId);
  };
  const onError = (error: Error) => toast.error(errorMessage(error));

  return {
    create: useMutation({
      mutationFn: (input: { rating: number; comment: string }) =>
        api<Review>(`/templates/${templateId}/reviews`, { method: "POST", body: input }),
      onSuccess: onSuccess("Review added"),
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string; rating: number; comment: string }) =>
        api<Review>(`/reviews/${id}`, { method: "PATCH", body: input }),
      onSuccess: onSuccess("Review updated"),
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/reviews/${id}`, { method: "DELETE" }),
      onSuccess: onSuccess("Review deleted"),
      onError,
    }),
  };
};
