"use client";

import { cx } from "./ui";

export function Stars({ value, count }: { value: number; count?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${value} out of 5`}>
      <span className="text-amber-500">
        {"★".repeat(rounded)}
        <span className="text-zinc-300 dark:text-zinc-700">{"★".repeat(5 - rounded)}</span>
      </span>
      {count !== undefined && (
        <span className="text-zinc-500">
          {count > 0 ? `${value.toFixed(1)} (${count})` : "no reviews"}
        </span>
      )}
    </span>
  );
}

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className={cx(
            "text-2xl leading-none transition-colors",
            star <= value ? "text-amber-500" : "text-zinc-300 hover:text-amber-300 dark:text-zinc-700",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
