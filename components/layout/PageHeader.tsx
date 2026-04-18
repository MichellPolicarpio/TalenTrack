import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
};

// Sits below AppTopBar (56px). Provides page-specific title, description, and actions.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-[56px] w-full shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-[13px] font-semibold tracking-[0.01em] text-[#111827]">
          {title}
        </h1>
        {description && (
          <p className="truncate text-[10.5px] leading-tight text-[#9CA3AF]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="ml-4 flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
