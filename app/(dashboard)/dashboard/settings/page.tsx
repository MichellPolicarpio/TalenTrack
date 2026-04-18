import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-neutral-400">
        Settings coming soon.
      </div>
    </div>
  );
}
