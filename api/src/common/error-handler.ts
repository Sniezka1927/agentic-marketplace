import { Elysia } from "elysia";
import { AppError } from "./errors";

const pgErrorCode = (error: unknown): string | undefined => {
  const cause = (error as { cause?: { errno?: unknown } })?.cause;
  return typeof cause?.errno === "string" ? cause.errno : undefined;
};

const body = (code: string, message: string, details?: unknown) => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return body(error.code, error.message);
    }

    switch (code) {
      case "VALIDATION":
        set.status = 422;
        return body(
          "VALIDATION_ERROR",
          "Invalid request",
          error.all.map((issue) => ({
            path: "path" in issue ? issue.path : "",
            message: issue.summary ?? issue.message,
          })),
        );
      case "PARSE":
        set.status = 400;
        return body("BAD_REQUEST", "Malformed request body");
      case "NOT_FOUND":
        set.status = 404;
        return body("NOT_FOUND", "Route not found");
    }

    const pgCode = pgErrorCode(error);
    if (pgCode === "23505") {
      set.status = 409;
      return body("CONFLICT", "Resource already exists");
    }
    if (pgCode === "23503") {
      set.status = 409;
      return body("CONFLICT", "Resource is referenced by other data");
    }

    console.error(error);
    set.status = 500;
    return body("INTERNAL_ERROR", "Internal server error");
  },
);
