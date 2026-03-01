import { AdminClient } from "@/components/admin/admin-client";
import { isAdminCookieSessionValid } from "@/lib/admin-auth";
import { listAdminUsersWithSources } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminCookieSessionValid().catch(() => false);
  const users = authenticated ? await listAdminUsersWithSources().catch(() => []) : [];

  return <AdminClient authenticated={authenticated} users={users} />;
}
