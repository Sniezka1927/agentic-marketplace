"use client";

import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useReviewMutations, useReviews } from "@/lib/queries";
import type { Review, Template } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { MutationError } from "./mutation-error";
import { Pagination } from "./pagination";
import { StarInput, Stars } from "./rating";
import { Button, ErrorBox, Spinner, Textarea } from "./ui";

function ReviewForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Pick<Review, "rating" | "comment">;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: { rating: number; comment: string }) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        placeholder="What did you like or miss?"
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || rating === 0}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function Reviews({ template, installed }: { template: Template; installed: boolean }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const reviews = useReviews(template.id, page);
  const { create, update, remove } = useReviewMutations(template.id);

  const isAuthor = user?.id === template.author?.id;
  const ownReview = reviews.data?.items.find((review) => review.user.id === user?.id);
  const canReview = user && installed && !isAuthor && !ownReview;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <MutationError error={create.error ?? update.error ?? remove.error} />

      {canReview && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <ReviewForm
            submitLabel="Add review"
            pending={create.isPending}
            onSubmit={(input) => create.mutate(input)}
          />
        </div>
      )}
      {user && !installed && !isAuthor && (
        <p className="text-sm text-zinc-500">Install this template to leave a review.</p>
      )}

      {reviews.isPending ? (
        <Spinner />
      ) : reviews.isError ? (
        <ErrorBox message={errorMessage(reviews.error)} />
      ) : reviews.data.items.length === 0 ? (
        <p className="text-sm text-zinc-500">No reviews yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {reviews.data.items.map((review) => {
            const mine = review.user.id === user?.id;
            const canDelete = mine || user?.role === "ADMIN";
            return (
              <li key={review.id} className="flex flex-col gap-2 py-4">
                {editing === review.id ? (
                  <ReviewForm
                    initial={review}
                    submitLabel="Save"
                    pending={update.isPending}
                    onSubmit={(input) =>
                      update.mutate(
                        { id: review.id, ...input },
                        { onSuccess: () => setEditing(null) },
                      )
                    }
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Stars value={review.rating} />
                        <span className="text-sm font-medium">{review.user.displayName}</span>
                        <span className="text-xs text-zinc-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {mine && (
                          <Button variant="ghost" onClick={() => setEditing(review.id)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(review.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                        {review.comment}
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {reviews.data && (
        <Pagination
          page={page}
          limit={reviews.data.limit}
          total={reviews.data.total}
          onChange={setPage}
        />
      )}
    </section>
  );
}
