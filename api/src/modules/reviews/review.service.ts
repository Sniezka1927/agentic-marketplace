import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors";
import type { PageRequest } from "../../common/pagination";
import type { EventPublisher } from "../../events/event-bus";
import type { InstallationRepository } from "../installations/installation.repository";
import type { TemplateRepository } from "../templates/template.repository";
import { canManage } from "../templates/template.service";
import type { User } from "../users/user.repository";
import type { ReviewChanges, ReviewRepository } from "./review.repository";

type Viewer = Pick<User, "id" | "role">;

export type CreateReviewInput = { rating: number; comment?: string };

export const createReviewService = (
  reviews: ReviewRepository,
  installations: InstallationRepository,
  templates: TemplateRepository,
  events: EventPublisher,
) => {
  const findOwnedReview = async (viewer: Viewer, reviewId: string, allowAdmin: boolean) => {
    const review = await reviews.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");
    const isOwner = review.userId === viewer.id;
    if (!isOwner && !(allowAdmin && viewer.role === "ADMIN")) {
      throw new ForbiddenError("You can only modify your own reviews");
    }
    return review;
  };

  return {
    async listForTemplate(templateId: string, viewer: Viewer | null, page: PageRequest) {
      const template = await templates.findById(templateId);
      if (!template || (template.status !== "PUBLISHED" && !canManage(viewer, template))) {
        throw new NotFoundError("Template not found");
      }
      return reviews.listByTemplate(templateId, page);
    },

    async create(viewer: Viewer, templateId: string, input: CreateReviewInput) {
      const template = await templates.findById(templateId);
      if (!template || template.status !== "PUBLISHED") {
        throw new NotFoundError("Template not found");
      }
      if (template.authorId === viewer.id) {
        throw new BusinessRuleError("You cannot review your own template");
      }
      if (!(await installations.find(viewer.id, templateId))) {
        throw new BusinessRuleError("Install the template before reviewing it");
      }
      if (await reviews.findByUserAndTemplate(viewer.id, templateId)) {
        throw new ConflictError("You have already reviewed this template");
      }
      const review = await reviews.create({
        userId: viewer.id,
        templateId,
        rating: input.rating,
        comment: input.comment?.trim() ?? "",
      });
      events.publish("review.created", { templateId, reviewId: review.id });
      return review;
    },

    async update(viewer: Viewer, reviewId: string, input: ReviewChanges) {
      await findOwnedReview(viewer, reviewId, false);
      const review = await reviews.update(reviewId, {
        rating: input.rating,
        comment: input.comment?.trim(),
      });
      events.publish("review.updated", { templateId: review.templateId, reviewId });
      return review;
    },

    async remove(viewer: Viewer, reviewId: string) {
      const review = await findOwnedReview(viewer, reviewId, true);
      await reviews.delete(review.id);
      events.publish("review.deleted", { templateId: review.templateId, reviewId });
      return review;
    },
  };
};

export type ReviewService = ReturnType<typeof createReviewService>;
