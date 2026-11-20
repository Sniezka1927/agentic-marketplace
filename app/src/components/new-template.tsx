"use client";

import { useRouter } from "next/navigation";
import { useTemplateMutations } from "@/lib/manage-queries";
import { TemplateForm } from "./template-form";
import { Card, PageTitle } from "./ui";

export function NewTemplate() {
  const router = useRouter();
  const { create } = useTemplateMutations();

  return (
    <>
      <PageTitle>New template</PageTitle>
      <Card className="max-w-2xl">
        <TemplateForm
          submitLabel="Create draft"
          pending={create.isPending}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: (template) => router.push(`/my/templates/${template.id}`),
            })
          }
        />
      </Card>
    </>
  );
}
