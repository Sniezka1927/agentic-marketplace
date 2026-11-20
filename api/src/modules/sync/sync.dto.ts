import { t, type Static } from "elysia";
import type { SyncRun } from "./sync-run.repository";

export const SyncRunDto = t.Object({
  id: t.String({ format: "uuid" }),
  status: t.UnionEnum(["RUNNING", "SUCCESS", "FAILED"]),
  imported: t.Integer(),
  error: t.Nullable(t.String()),
  triggeredById: t.Nullable(t.String()),
  startedAt: t.String({ format: "date-time" }),
  finishedAt: t.Nullable(t.String({ format: "date-time" })),
});

export const toSyncRunDto = (run: SyncRun): Static<typeof SyncRunDto> => ({
  id: run.id,
  status: run.status,
  imported: run.imported,
  error: run.error,
  triggeredById: run.triggeredById,
  startedAt: run.startedAt.toISOString(),
  finishedAt: run.finishedAt?.toISOString() ?? null,
});
