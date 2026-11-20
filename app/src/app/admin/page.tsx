import { AdminPanel } from "@/components/admin/admin-panel";
import { RequireAuth } from "@/components/require-auth";

export default function AdminPage() {
  return (
    <RequireAuth role="ADMIN">
      <AdminPanel />
    </RequireAuth>
  );
}
