import type { ReactNode } from "react";

// Friendly placeholder when a list is empty or a section isn't built yet.
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <p className="text-base font-bold">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-md text-muted">{children}</p>}
    </div>
  );
}
