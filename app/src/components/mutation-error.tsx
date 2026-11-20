import { errorMessage } from "@/lib/api";
import { ErrorBox } from "./ui";

export function MutationError({ error }: { error: unknown }) {
  return error ? <ErrorBox message={errorMessage(error)} /> : null;
}
