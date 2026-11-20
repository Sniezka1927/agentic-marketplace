import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Spinner } from "@/components/ui";

export default function TemplatesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Catalog />
    </Suspense>
  );
}
