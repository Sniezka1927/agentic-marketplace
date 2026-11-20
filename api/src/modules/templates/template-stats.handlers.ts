import type { EventBus } from "../../events/event-bus";
import type { TemplateRepository } from "./template.repository";

export const registerTemplateStatsHandlers = (
  events: EventBus,
  templates: TemplateRepository,
) => {
  const refreshInstalls = ({ templateId }: { templateId: string }) =>
    templates.refreshInstallStats(templateId);
  const refreshRatings = ({ templateId }: { templateId: string }) =>
    templates.refreshRatingStats(templateId);

  events.subscribe("template.installed", refreshInstalls);
  events.subscribe("template.uninstalled", refreshInstalls);
  events.subscribe("review.created", refreshRatings);
  events.subscribe("review.updated", refreshRatings);
  events.subscribe("review.deleted", refreshRatings);
};
