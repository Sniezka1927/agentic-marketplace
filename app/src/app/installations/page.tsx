import { InstallationsList } from "@/components/installations-list";
import { RequireAuth } from "@/components/require-auth";

export default function InstallationsPage() {
  return (
    <RequireAuth>
      <InstallationsList />
    </RequireAuth>
  );
}
