import { t, type Static } from "elysia";
import { TemplateDto, toTemplateDto } from "../templates/template.dto";
import type { Installation, InstallationWithTemplate } from "./installation.repository";

export const InstallationDto = t.Object({
  id: t.String({ format: "uuid" }),
  templateId: t.String({ format: "uuid" }),
  installedAt: t.String({ format: "date-time" }),
});

export const InstallationWithTemplateDto = t.Composite([
  InstallationDto,
  t.Object({ template: TemplateDto }),
]);

export const toInstallationDto = (
  installation: Installation,
): Static<typeof InstallationDto> => ({
  id: installation.id,
  templateId: installation.templateId,
  installedAt: installation.installedAt.toISOString(),
});

export const toInstallationWithTemplateDto = (
  installation: InstallationWithTemplate,
): Static<typeof InstallationWithTemplateDto> => ({
  ...toInstallationDto(installation),
  template: toTemplateDto(installation.template),
});
