import type { Enums } from "@/lib/supabase/database.types";
import { postStatusLabel, postTypeLabel } from "@/lib/labels";

const statusClass: Record<Enums<"post_status">, string> = {
  draft: "bg-[#efedf3] text-[#5d566b]",
  pending: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  changes_requested: "bg-danger-bg text-danger",
};

export function StatusBadge({ status }: { status: Enums<"post_status"> }) {
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap ${statusClass[status]}`}>
      {postStatusLabel[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: Enums<"post_type"> }) {
  return (
    <span className="rounded-md bg-chip px-2 py-1 text-xs font-semibold text-brand">{postTypeLabel[type]}</span>
  );
}
