import type { PreviewMedia } from "@/components/post-preview";
import type { ThreadComment } from "@/lib/comments";
import type { Enums } from "@/lib/supabase/database.types";

// A post as the client sees it (signed media URLs, resolved comment authors).
export type ClientPost = {
  id: string;
  type: Enums<"post_type">;
  status: Enums<"post_status">;
  title: string;
  caption: string;
  plannedDate: string;
  decidedLabel: string | null;
  media: PreviewMedia[];
  comments: ThreadComment[];
};

export type MonthOption = { value: string; label: string };
