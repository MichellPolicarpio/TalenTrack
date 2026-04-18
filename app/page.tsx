import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginClient } from "@/components/login-client";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
