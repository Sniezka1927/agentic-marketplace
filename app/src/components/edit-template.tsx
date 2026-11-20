"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { useTemplateMutations } from "@/lib/manage-queries";
import { useTemplate } from "@/lib/queries";
import { Badge } from "./badge";
import { ConfirmButton } from "./confirm-button";
import { TemplateForm } from "./template-form";
import { Button, Card, ErrorBox, PageTitle, Spinner } from "./ui";

export function EditTemplate() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const template = useTemplate(id);
  const { update, transition, remove } = useTemplateMutations();
  const [conflict, setConflict] = useState(false);

  if (template.isPending) return <Spinner />;
  if (template.isError) return <ErrorBox message={errorMessage(template.error)} />;

  const t = template.data;
  const busy = update.isPending || transition.isPending || remove.isPending;

  const reload = async () => {
    await template.refetch();
    setConflict(false);
  };

  return (
    <>
      <PageTitle
        action={
          t.status === "PUBLISHED" && (
            <Link href={`/templates/${t.id}`} className="text-sm underline">
              View public page
            </Link>
          )
        }
      >
        <span className="flex items-center gap-3">
          {t.name}
          <Badge tone="muted">{t.status}</Badge>
        </span>
      </PageTitle>

      {conflict && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ErrorBox message="This template was changed by someone else since you opened it. Reload to get the latest version, then apply your changes again." />
          <Button variant="secondary" onClick={reload}>
            Reload latest version
          </Button>
        </div>
      )}

      <Card className="max-w-2xl">
        <TemplateForm
          key={t.version}
          initial={{
            name: t.name,
            description: t.description,
            templateUrl: t.templateUrl,
            categoryId: t.category.id,
          }}
          submitLabel="Save changes"
          pending={update.isPending}
          onSubmit={(input) =>
            update.mutate(
              { id: t.id, version: t.version, ...input },
              {
                onError: (error) => {
                  if (error instanceof ApiError && error.status === 409) setConflict(true);
                  else toast.error(errorMessage(error));
                },
              },
            )
          }
        >
          {t.status !== "PUBLISHED" && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => transition.mutate({ id: t.id, action: "publish" })}
            >
              Publish
            </Button>
          )}
          {t.status === "PUBLISHED" && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => transition.mutate({ id: t.id, action: "archive" })}
            >
              Archive
            </Button>
          )}
          <span className="ml-auto">
            <ConfirmButton
              disabled={busy}
              confirmLabel="Delete permanently?"
              onConfirm={() =>
                remove.mutate(t.id, { onSuccess: () => router.push("/my/templates") })
              }
            >
              Delete
            </ConfirmButton>
          </span>
        </TemplateForm>
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Version {t.version} · {t.installsCount} installs. Templates with installations can only
        be archived.
      </p>
    </>
  );
}
