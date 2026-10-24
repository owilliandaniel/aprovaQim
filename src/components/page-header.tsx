import type { ReactNode } from "react";

// Eyebrow + title + subtitle used at the top of each page.
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-brand-2">{eyebrow}</div>
        <h1 className="mt-1 mb-1.5 text-[25px] leading-tight font-extrabold tracking-[-1.2px] md:text-[30px]">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted md:text-[17px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
