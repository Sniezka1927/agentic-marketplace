import Link from "next/link";
import { authorName } from "@/lib/format";
import type { Template } from "@/lib/types";
import { Stars } from "./rating";
import { Badge } from "./badge";
import { BotAvatar } from "./bot-avatar";

export function TemplateCard({ template }: { template: Template }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BotAvatar botId={template.botId} size={40} />
          <h2 className="font-semibold leading-tight">{template.name}</h2>
        </div>
        <div className="flex shrink-0 gap-1">
          {template.status !== "PUBLISHED" && <Badge tone="muted">{template.status}</Badge>}
        </div>
      </div>
      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
        {template.description || "No description"}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          {template.category.name} · by {authorName(template)}
        </span>
        <span className="flex items-center gap-3">
          <Stars value={template.ratingAvg} count={template.ratingCount} />
          <span>{template.installsCount} installs</span>
        </span>
      </div>
    </Link>
  );
}
