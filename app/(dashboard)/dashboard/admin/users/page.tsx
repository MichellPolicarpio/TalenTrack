import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    redirect("/dashboard/resume");
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage users and roles (Phase 2)."
      />
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    </>
  );
}
