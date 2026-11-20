"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { useStartSync, useSyncRuns } from "@/lib/manage-queries";
import type { SyncRun } from "@/lib/types";
import { Badge } from "../badge";
import { Pagination } from "../pagination";
import { Button, ErrorBox, Spinner } from "../ui";

const formatTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const statusTone = (status: SyncRun["status"]) =>
  status === "SUCCESS" ? "default" : "muted";

export function SyncAdmin() {
  const [page, setPage] = useState(1);
  const runs = useSyncRuns(page);
  const start = useStartSync();
  const running = runs.data?.items.some((run) => run.status === "RUNNING");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={start.isPending || running} onClick={() => start.mutate()}>
          {running ? "Synchronizing…" : "Import from X now"}
        </Button>
        <p className="text-sm text-zinc-500">
          Runs automatically on a schedule. Imported bots appear in the catalog under the X
          source.
        </p>
      </div>
      {runs.isPending ? (
        <Spinner />
      ) : runs.isError ? (
        <ErrorBox message={errorMessage(runs.error)} />
      ) : runs.data.items.length === 0 ? (
        <p className="text-sm text-zinc-500">No synchronizations yet.</p>
      ) : (
        <>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Started</th>
                <th className="py-2">Finished</th>
                <th className="py-2">Status</th>
                <th className="py-2">Imported</th>
                <th className="py-2">Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {runs.data.items.map((run) => (
                <tr key={run.id}>
                  <td className="py-2">{formatTime(run.startedAt)}</td>
                  <td className="py-2">{formatTime(run.finishedAt)}</td>
                  <td className="py-2">
                    <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                    {run.error && <p className="mt-1 text-xs text-red-600">{run.error}</p>}
                  </td>
                  <td className="py-2">{run.imported}</td>
                  <td className="py-2 text-zinc-500">{run.triggeredById ? "manual" : "scheduler"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            limit={runs.data.limit}
            total={runs.data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
