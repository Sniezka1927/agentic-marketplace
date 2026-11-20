import { t, type Static } from "elysia";
import type { ReviewWithUser } from "./review.repository";

export const ReviewDto = t.Object({
  id: t.String({ format: "uuid" }),
  templateId: t.String({ format: "uuid" }),
  rating: t.Integer({ minimum: 1, maximum: 5 }),
  comment: t.String(),
  user: t.Object({ id: t.String(), displayName: t.String() }),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const CreateReviewBody = t.Object({
  rating: t.Integer({ minimum: 1, maximum: 5 }),
  comment: t.Optional(t.String({ maxLength: 2000 })),
});

export const UpdateReviewBody = t.Partial(CreateReviewBody, { minProperties: 1 });

export const toReviewDto = (review: ReviewWithUser): Static<typeof ReviewDto> => ({
  id: review.id,
  templateId: review.templateId,
  rating: review.rating,
  comment: review.comment,
  user: review.user,
  createdAt: review.createdAt.toISOString(),
  updatedAt: review.updatedAt.toISOString(),
});
