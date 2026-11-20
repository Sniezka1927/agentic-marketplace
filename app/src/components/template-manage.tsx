"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { useTemplateMutations } from "@/lib/manage-queries";
import type { Template } from "@/lib/types";
import { ConfirmButton } from "./confirm-button";
import { TemplateForm } from "./template-form";
import { Button, Card, ErrorBox } from "./ui";

export function TemplateManage({
  template,
  onReload,
}: {
  template: Template;
  onReload: () => Promise<unknown>;
}) {
  const router = useRouter();
  const { update, transition, remove } = useTemplateMutations();
  const [editing, setEditing] = useState(false);
  const [conflict, setConflict] = useState(false);
  const busy = update.isPending || transition.isPending || remove.isPending;

  const reload = async () => {
    await onReload();
    setConflict(false);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-semibold">Manage template</h2>
        <Button variant="secondary" disabled={busy} onClick={() => setEditing(!editing)}>
          {editing ? "Close editor" : "Edit"}
        </Button>
        {template.status === "PUBLISHED" ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => transition.mutate({ id: template.id, action: "archive" })}
          >
            Archive
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => transition.mutate({ id: template.id, action: "publish" })}
          >
            Publish
          </Button>
        )}
        <ConfirmButton
          disabled={busy}
          confirmLabel="Delete permanently?"
          onConfirm={() =>
            remove.mutate(template.id, { onSuccess: () => router.push("/my/templates") })
          }
        >
          Delete
        </ConfirmButton>
      </div>

      {conflict && (
        <div className="flex flex-wrap items-center gap-3">
          <ErrorBox message="This template was changed by someone else since you opened it. Reload to get the latest version, then apply your changes again." />
          <Button variant="secondary" onClick={reload}>
            Reload latest version
          </Button>
        </div>
      )}

      {editing && (
        <TemplateForm
          key={template.version}
          initial={{
            name: template.name,
            description: template.description,
            xUrl: template.xUrl,
            categoryId: template.category.id,
          }}
          submitLabel="Save changes"
          pending={update.isPending}
          onSubmit={(input) =>
            update.mutate(
              { id: template.id, version: template.version, ...input },
              {
                onSuccess: () => setEditing(false),
                onError: (error) => {
                  if (error instanceof ApiError && error.status === 409) setConflict(true);
                  else toast.error(errorMessage(error));
                },
              },
            )
          }
        />
      )}

      <p className="text-xs text-zinc-500">
        Version {template.version}. Templates with installations can only be archived.
      </p>
    </Card>
  );
}
