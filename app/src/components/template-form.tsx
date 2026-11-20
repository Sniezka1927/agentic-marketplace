"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { TemplateInput } from "@/lib/manage-queries";
import { useCategories } from "@/lib/queries";
import { Button, Field, Input, Select, Textarea } from "./ui";

export const MIN_PUBLISH_DESCRIPTION = 20;

export function TemplateForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  children,
}: {
  initial?: TemplateInput;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: TemplateInput) => void;
  children?: ReactNode;
}) {
  const categories = useCategories();
  const [form, setForm] = useState<TemplateInput>(
    initial ?? { name: "", description: "", templateUrl: "grokbot://app/v1/bot-template?id=", categoryId: "" },
  );

  const set = (field: keyof TemplateInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      templateUrl: form.templateUrl.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Name">
        <Input
          required
          minLength={3}
          maxLength={120}
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
        />
      </Field>
      <Field label={`Description (at least ${MIN_PUBLISH_DESCRIPTION} characters to publish)`}>
        <Textarea
          maxLength={5000}
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
        />
      </Field>
      <Field label="Template URL (grokbot:// or https://)">
        <Input
          required
          pattern="(grokbot|https)://\S+"
          value={form.templateUrl}
          onChange={(e) => set("templateUrl")(e.target.value)}
        />
      </Field>
      <Field label="Category">
        <Select
          required
          value={form.categoryId}
          onChange={(e) => set("categoryId")(e.target.value)}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {children}
      </div>
    </form>
  );
}
