import { t } from "elysia";

export const IdParams = t.Object({ id: t.String({ format: "uuid" }) });

export const ErrorResponse = t.Object({
  error: t.Object({
    code: t.String(),
    message: t.String(),
    details: t.Optional(t.Unknown()),
  }),
});
