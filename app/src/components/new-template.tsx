"use client";

import { useRouter } from "next/navigation";
import { useTemplateMutations } from "@/lib/manage-queries";
import { MutationError } from "./mutation-error";
import { TemplateForm } from "./template-form";
import { Card, PageTitle } from "./ui";

export function NewTemplate() {
  const router = useRouter();
  const { create } = useTemplateMutations();

  return (
    <>
      <PageTitle>New template</PageTitle>
      <Card className="flex max-w-2xl flex-col gap-4">
        <MutationError error={create.error} />
        <TemplateForm
          submitLabel="Create draft"
          pending={create.isPending}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: (template) => router.push(`/templates/${template.id}`),
            })
          }
        />
      </Card>
    </>
  );
}
