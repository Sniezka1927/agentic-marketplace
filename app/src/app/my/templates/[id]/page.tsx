import { Suspense } from "react";
import { EditTemplate } from "@/components/edit-template";
import { RequireAuth } from "@/components/require-auth";
import { Spinner } from "@/components/ui";

export default function EditTemplatePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RequireAuth>
        <EditTemplate />
      </RequireAuth>
    </Suspense>
  );
}
