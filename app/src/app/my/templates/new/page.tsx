import { NewTemplate } from "@/components/new-template";
import { RequireAuth } from "@/components/require-auth";

export default function NewTemplatePage() {
  return (
    <RequireAuth>
      <NewTemplate />
    </RequireAuth>
  );
}
