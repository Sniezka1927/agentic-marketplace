"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { keys } from "./queries";
import type {
  Category,
  Page,
  Role,
  Template,
  TemplateStatus,
  User,
} from "./types";

export type TemplateInput = {
  name: string;
  description: string;
  xUrl: string;
  categoryId: string;
};

export const useOwnTemplates = (page: number, status?: TemplateStatus) =>
  useQuery({
    queryKey: ["templates", "mine", page, status],
    queryFn: () =>
      api<Page<Template>>("/templates/mine", { query: { page, limit: 12, status, sort: "newest" } }),
    placeholderData: (previous) => previous,
  });

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();
  const refresh = (template?: Template) => {
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    if (template) queryClient.setQueryData(keys.template(template.id), template);
  };

  return {
    create: useMutation({
      mutationFn: (input: TemplateInput) =>
        api<Template>("/templates", { method: "POST", body: input }),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: TemplateInput & { id: string; version: number }) =>
        api<Template>(`/templates/${id}`, { method: "PATCH", body: input }),
      onSuccess: refresh,
    }),
    transition: useMutation({
      mutationFn: ({ id, action }: { id: string; action: "publish" | "archive" }) =>
        api<Template>(`/templates/${id}/${action}`, { method: "POST" }),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/templates/${id}`, { method: "DELETE" }),
      onSuccess: () => refresh(),
    }),
  };
};

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: keys.categories });
  return {
    create: useMutation({
      mutationFn: (input: { name: string; description: string }) =>
        api<Category>("/categories", { method: "POST", body: input }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string; name: string; description: string }) =>
        api<Category>(`/categories/${id}`, { method: "PATCH", body: input }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: "DELETE" }),
      onSuccess,
    }),
  };
};

export const useUsers = (page: number, q: string) =>
  useQuery({
    queryKey: ["users", page, q],
    queryFn: () => api<Page<User>>("/users", { query: { page, limit: 20, q } }),
    placeholderData: (previous) => previous,
  });

export const useChangeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api<User>(`/users/${id}/role`, { method: "PATCH", body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};
