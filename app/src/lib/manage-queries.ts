"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "./api";
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

const onError = (error: Error) => toast.error(errorMessage(error));

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
      onSuccess: (template) => {
        toast.success("Draft created");
        refresh(template);
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: TemplateInput & { id: string; version: number }) =>
        api<Template>(`/templates/${id}`, { method: "PATCH", body: input }),
      onSuccess: (template) => {
        toast.success("Changes saved");
        refresh(template);
      },
    }),
    transition: useMutation({
      mutationFn: ({ id, action }: { id: string; action: "publish" | "archive" }) =>
        api<Template>(`/templates/${id}/${action}`, { method: "POST" }),
      onSuccess: (template) => {
        toast.success(template.status === "PUBLISHED" ? "Template published" : "Template archived");
        refresh(template);
      },
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/templates/${id}`, { method: "DELETE" }),
      onSuccess: () => {
        toast.success("Template deleted");
        refresh();
      },
      onError,
    }),
  };
};

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();
  const onSuccess = (message: string) => () => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: keys.categories });
  };
  return {
    create: useMutation({
      mutationFn: (input: { name: string; description: string }) =>
        api<Category>("/categories", { method: "POST", body: input }),
      onSuccess: onSuccess("Category created"),
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string; name: string; description: string }) =>
        api<Category>(`/categories/${id}`, { method: "PATCH", body: input }),
      onSuccess: onSuccess("Category updated"),
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: "DELETE" }),
      onSuccess: onSuccess("Category deleted"),
      onError,
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
    onSuccess: (user) => {
      toast.success(`${user.displayName} is now ${user.role}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError,
  });
};
