import { formatRelative } from "@/lib/format";
import { postTypeLabel } from "@/lib/labels";
import type { UserRole } from "@/lib/roles";
import type { Enums } from "@/lib/supabase/database.types";

// Columns the bell reads; the actor needs the FK name (notifications links to profiles twice).
export const NOTIFICATION_COLUMNS =
  "id, type, read_at, created_at, post_id, post:posts(title, type), client:clients(name), actor:profiles!notifications_actor_id_fkey(full_name, role)";

export type NotificationRow = {
  id: string;
  type: Enums<"notification_type">;
  read_at: string | null;
  created_at: string;
  post_id: string | null;
  post: { title: string; type: Enums<"post_type"> } | null;
  client: { name: string } | null;
  actor: { full_name: string; role: Enums<"user_role"> } | null;
};

// One line of the list: "<lead> <rest>", e.g. "Empresa X" + "aprovou “Post”.".
export type NotificationItem = {
  key: string;
  type: Enums<"notification_type">;
  // Unread ids behind the item (several when a batch of posts was sent at once).
  unreadIds: string[];
  lead: string;
  rest: string;
  meta: string;
  href: string;
};

// Posts sent together come from one statement, so their notifications share the timestamp.
function groupBatches(rows: NotificationRow[]) {
  const groups: NotificationRow[][] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (row.type === "post_sent" && last?.[0].type === "post_sent" && last[0].created_at === row.created_at) last.push(row);
    else groups.push([row]);
  }
  return groups;
}

function describe(group: NotificationRow[], role: UserRole): Pick<NotificationItem, "lead" | "rest" | "href"> {
  const [row] = group;
  const title = row.post ? `“${row.post.title}”` : "um conteúdo";

  if (role === "client") {
    const href = row.post_id ? `/cliente?conteudo=${row.post_id}` : "/cliente";
    if (row.type !== "post_sent") return { lead: row.actor?.full_name || "A agência", rest: `comentou em ${title}.`, href };
    if (group.length > 1) return { lead: `${group.length} novos conteúdos`, rest: "para aprovar.", href: "/cliente" };
    return { lead: "Novo conteúdo", rest: `para aprovar: ${title}.`, href };
  }

  const rest: Record<Enums<"notification_type">, string> = {
    post_approved: `aprovou ${title}.`,
    changes_requested: `pediu ajuste em ${title}.`,
    new_comment: `comentou em ${title}.`,
    post_sent: `recebeu ${title}.`,
  };
  return {
    lead: row.client?.name || row.actor?.full_name || "O cliente",
    rest: rest[row.type],
    href: row.post_id ? `/agencia/conteudos/${row.post_id}` : "/agencia",
  };
}

// Newest-first rows -> list items for the viewer's role.
export function toNotificationItems(rows: NotificationRow[], role: UserRole, now: number): NotificationItem[] {
  return groupBatches(rows).map((group) => {
    const [row] = group;
    const type = group.length === 1 && row.post ? postTypeLabel[row.post.type] : null;
    return {
      key: row.id,
      type: row.type,
      unreadIds: group.filter((item) => !item.read_at).map((item) => item.id),
      meta: [type, formatRelative(row.created_at, now)].filter(Boolean).join(" · "),
      ...describe(group, role),
    };
  });
}
