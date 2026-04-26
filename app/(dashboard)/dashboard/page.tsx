import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const { role } = session.user;
  if (role === "Admin") {
    redirect("/dashboard/admin/users");
  }
  redirect("/dashboard/resume");
}
