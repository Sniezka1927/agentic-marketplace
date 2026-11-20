import { BusinessRuleError, ConflictError, NotFoundError } from "../../common/errors";
import type { PageRequest } from "../../common/pagination";
import type { EventPublisher } from "../../events/event-bus";
import type { TemplateRepository } from "../templates/template.repository";
import type { InstallationRepository } from "./installation.repository";

export const createInstallationService = (
  installations: InstallationRepository,
  templates: TemplateRepository,
  events: EventPublisher,
) => ({
  async install(userId: string, templateId: string) {
    const template = await templates.findById(templateId);
    if (!template) throw new NotFoundError("Template not found");
    if (template.status !== "PUBLISHED") {
      throw new BusinessRuleError("Only published templates can be installed");
    }
    if (await installations.find(userId, templateId)) {
      throw new ConflictError("Template is already installed");
    }
    const installation = await installations.create(userId, templateId);
    events.publish("template.installed", { templateId, userId });
    return installation;
  },

  async uninstall(userId: string, templateId: string) {
    if (!(await installations.find(userId, templateId))) {
      throw new NotFoundError("Template is not installed");
    }
    await installations.delete(userId, templateId);
    events.publish("template.uninstalled", { templateId, userId });
  },

  listOwn: (userId: string, page: PageRequest) => installations.listByUser(userId, page),
});

export type InstallationService = ReturnType<typeof createInstallationService>;
