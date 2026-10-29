import type { Enums } from "@/lib/supabase/database.types";
import { postStatusLabel, postTypeLabel } from "@/lib/labels";

// Status palette shared by badges and the calendar: soft background, text, solid swatch, stripe.
export const statusColors: Record<Enums<"post_status">, { soft: string; text: string; solid: string; border: string }> = {
  draft: { soft: "bg-[#efedf3]", text: "text-[#5d566b]", solid: "bg-[#5d566b]", border: "border-[#5d566b]" },
  pending: { soft: "bg-warn-bg", text: "text-warn", solid: "bg-warn", border: "border-warn" },
  approved: { soft: "bg-ok-bg", text: "text-ok", solid: "bg-ok", border: "border-ok" },
  changes_requested: { soft: "bg-danger-bg", text: "text-danger", solid: "bg-danger", border: "border-danger" },
};

export function StatusBadge({ status }: { status: Enums<"post_status"> }) {
  const { soft, text } = statusColors[status];
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap ${soft} ${text}`}>
      {postStatusLabel[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: Enums<"post_type"> }) {
  return (
    <span className="rounded-md bg-chip px-2 py-1 text-xs font-semibold text-brand">{postTypeLabel[type]}</span>
  );
}
