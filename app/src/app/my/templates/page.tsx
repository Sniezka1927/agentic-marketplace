import { MyTemplates } from "@/components/my-templates";
import { RequireAuth } from "@/components/require-auth";

export default function MyTemplatesPage() {
  return (
    <RequireAuth>
      <MyTemplates />
    </RequireAuth>
  );
}
