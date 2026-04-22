import { getGlobalSettings } from "@/lib/repositories/settings.repository";

export async function ThemeInjector() {
  const settings = await getGlobalSettings();
  
  const primaryColor = settings["branding.primaryColor"] || settings.primary_color || "#FF6C06";
  const navColor = settings["branding.sidebarAccentColor"] || settings.sidebar_active_color || "#C05E0E";

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --primary: ${primaryColor};
          --sidebar-accent-foreground: ${navColor};
          --sidebar-primary: ${primaryColor};
        }
      `
    }} />
  );
}
