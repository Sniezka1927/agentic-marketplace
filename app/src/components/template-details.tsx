"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError, errorMessage } from "@/lib/api";
import { authorName, formatDate } from "@/lib/format";
import { useInstallToggle, useOwnInstallation, useTemplate } from "@/lib/queries";
import { useAuth } from "./auth-provider";
import { Badge } from "./badge";
import { BotAvatar } from "./bot-avatar";
import { Stars } from "./rating";
import { MutationError } from "./mutation-error";
import { Reviews } from "./reviews";
import { TemplateManage } from "./template-manage";
import { Button, Card, ErrorBox, Spinner } from "./ui";

export function TemplateDetails() {
  const { id } = useParams<{ id: string }>();
  const { status, user } = useAuth();
  const template = useTemplate(id);
  const installation = useOwnInstallation(id, status === "authenticated");
  const toggle = useInstallToggle(id);

  if (template.isPending) return <Spinner />;
  if (template.isError) {
    const notFound = template.error instanceof ApiError && template.error.status === 404;
    return (
      <ErrorBox message={notFound ? "This template does not exist or is not public." : errorMessage(template.error)} />
    );
  }

  const t = template.data;
  const installed = Boolean(installation.data);
  const canManage = user && (user.role === "ADMIN" || user.id === t.author?.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={canManage ? "/my/templates" : "/templates"}
          className="text-sm text-zinc-500 hover:underline"
        >
          {canManage ? "← My templates" : "← All templates"}
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <BotAvatar botId={t.botId} size={96} animated blobs />
          <h1 className="text-3xl font-semibold tracking-tight">{t.name}</h1>
          {t.status !== "PUBLISHED" && <Badge tone="muted">{t.status}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
          <span>by {authorName(t)}</span>
          <span>{t.category.name}</span>
          <Stars value={t.ratingAvg} count={t.ratingCount} />
          <span>{t.installsCount} installs</span>
          <span>published {formatDate(t.publishedAt)}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {t.description || "No description"}
        </p>
        <Card className="flex h-fit flex-col gap-3">
          {status === "authenticated" ? (
            t.status === "PUBLISHED" ? (
              <Button
                variant={installed ? "secondary" : "primary"}
                disabled={toggle.isPending || installation.isPending}
                onClick={() =>
                  toggle.mutate(installed, {
                    onSuccess: () => {
                      if (!installed) window.location.href = t.installUrl;
                    },
                  })
                }
              >
                {installed ? "Uninstall" : "Install in Grok Bot"}
              </Button>
            ) : (
              <p className="text-sm text-zinc-500">Only published templates can be installed.</p>
            )
          ) : (
            <Link href={`/login?next=/templates/${t.id}`}>
              <Button className="w-full">Log in to install</Button>
            </Link>
          )}
          <MutationError error={toggle.error} />
          {installed && (
            <a href={t.installUrl} className="text-center text-sm font-medium underline">
              Open in Grok Bot
            </a>
          )}
          <a
            href={t.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm text-zinc-500 hover:underline"
          >
            View on x.ai
          </a>
        </Card>
      </div>

      {canManage && <TemplateManage template={t} onReload={template.refetch} />}

      <Reviews template={t} installed={installed} />
    </div>
  );
}
