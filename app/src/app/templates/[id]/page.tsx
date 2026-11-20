import { Suspense } from "react";
import { TemplateDetails } from "@/components/template-details";
import { Spinner } from "@/components/ui";

export default function TemplatePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <TemplateDetails />
    </Suspense>
  );
}
