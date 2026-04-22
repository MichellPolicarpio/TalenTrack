import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGlobalSettings } from "@/lib/repositories/settings.repository";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  const settings = await getGlobalSettings();

  return (
    <div className="flex flex-col gap-6 p-6">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
