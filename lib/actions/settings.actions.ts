"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateGlobalSetting } from "@/lib/repositories/settings.repository";

export async function updateGlobalSettingAction(key: string, value: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to change settings.");
  }

  await updateGlobalSetting(key, value, session.user.id);
  
  // Revalidate everything to ensure the new theme/currency is applied
  revalidatePath("/", "layout");
}
