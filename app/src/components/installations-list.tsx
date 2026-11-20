"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useInstallations } from "@/lib/queries";
import { Pagination } from "./pagination";
import { TemplateCard } from "./template-card";
import { ErrorBox, PageTitle, Spinner } from "./ui";

export function InstallationsList() {
  const [page, setPage] = useState(1);
  const installations = useInstallations(page);

  return (
    <>
      <PageTitle>Installed templates</PageTitle>
      {installations.isPending ? (
        <Spinner />
      ) : installations.isError ? (
        <ErrorBox message={errorMessage(installations.error)} />
      ) : installations.data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          You have not installed any templates yet.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {installations.data.items.map((installation) => (
              <div key={installation.id} className="flex flex-col gap-1">
                <TemplateCard template={installation.template} />
                <span className="px-1 text-xs text-zinc-500">
                  Installed {formatDate(installation.installedAt)}
                </span>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            limit={installations.data.limit}
            total={installations.data.total}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
