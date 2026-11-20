"use client";

import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { useOwnTemplates } from "@/lib/manage-queries";
import type { TemplateStatus } from "@/lib/types";
import { Pagination } from "./pagination";
import { TemplateCard } from "./template-card";
import { Button, ErrorBox, PageTitle, Select, Spinner } from "./ui";

export function MyTemplates() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TemplateStatus | "">("");
  const templates = useOwnTemplates(page, status || undefined);

  return (
    <>
      <PageTitle
        action={
          <Link href="/my/templates/new">
            <Button>New template</Button>
          </Link>
        }
      >
        My templates
      </PageTitle>
      <div className="mb-6 max-w-48">
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TemplateStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>
      {templates.isPending ? (
        <Spinner />
      ) : templates.isError ? (
        <ErrorBox message={errorMessage(templates.error)} />
      ) : templates.data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          No templates yet. Create your first one.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.data.items.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
          <Pagination
            page={page}
            limit={templates.data.limit}
            total={templates.data.total}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
