import type { ReactNode } from "react";
import { cx } from "./ui";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "muted" }) {
  return (
    <span
      className={cx(
        "rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tone === "default"
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
      )}
    >
      {children}
    </span>
  );
}
