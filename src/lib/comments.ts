import { formatDateTime } from "@/lib/format";
import type { Enums } from "@/lib/supabase/database.types";

export const MAX_COMMENT = 2000;

// A comment ready to show: names and dates are resolved on the server.
export type ThreadComment = {
  id: string;
  body: string;
  isChangeRequest: boolean;
  when: string;
  authorName: string;
  fromAgency: boolean;
  mine: boolean;
};

type CommentRow = {
  id: string;
  body: string;
  is_change_request: boolean;
  created_at: string;
  author_id: string | null;
  author: { full_name: string; email: string; role: Enums<"user_role"> } | null;
};

// Maps database rows to thread items, oldest first.
export function toThreadComments(rows: CommentRow[], viewerId: string): ThreadComment[] {
  return [...rows]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((row) => ({
      id: row.id,
      body: row.body,
      isChangeRequest: row.is_change_request,
      when: formatDateTime(row.created_at),
      authorName: row.author_id === viewerId ? "Você" : row.author?.full_name || row.author?.email || "Usuário removido",
      fromAgency: row.author?.role === "agency",
      mine: row.author_id === viewerId,
    }));
}
