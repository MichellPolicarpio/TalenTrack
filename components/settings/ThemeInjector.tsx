import { getGlobalSettings } from "@/lib/repositories/settings.repository";

export async function ThemeInjector() {
  let settings: Record<string, string> = {};
  
  try {
    settings = await getGlobalSettings();
  } catch (error) {
    // Silently handle missing DB config during build or startup
    console.warn("ThemeInjector: Using default branding because settings couldn't be fetched.");
  }
  
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
