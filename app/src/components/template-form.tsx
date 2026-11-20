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
    initial ?? { name: "", description: "", xUrl: "", categoryId: "" },
  );

  const set = (field: keyof TemplateInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      xUrl: form.xUrl.trim(),
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
      <Field label="x.ai bot link">
        <Input
          required
          type="url"
          placeholder="https://x.ai/bot/SeMqhg9bPD4Qd_8i7I-vN"
          pattern="https://(www\.)?x\.ai/bot/[A-Za-z0-9_\-]{1,100}/?(\?.*)?"
          title="Link to a bot on x.ai, e.g. https://x.ai/bot/<id>"
          value={form.xUrl}
          onChange={(e) => set("xUrl")(e.target.value)}
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
