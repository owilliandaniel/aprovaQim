import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import type { PreviewMedia } from "@/components/post-preview";
import { CardGridSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { toThreadComments } from "@/lib/comments";
import { currentMonth, formatDateTime, formatMonth, isYearMonth, monthRange } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { driveFileId } from "@/lib/media";
import { signMediaPaths } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { ClientBoard } from "./client-board";
import type { ClientPost, MonthOption } from "./types";

export default function ClientContentPage({ searchParams }: PageProps<"/cliente">) {
  return (
    <>
      <PageHeader
        eyebrow="Conteúdos"
        title="Conteúdos para aprovar"
        subtitle="Confira os materiais e aprove ou solicite ajustes."
      />
      <Suspense fallback={<CardGridSkeleton />}>
        {searchParams.then(({ mes, conteudo }) => (
          <ContentView
            monthParam={typeof mes === "string" ? mes : null}
            focusParam={typeof conteudo === "string" ? conteudo : null}
          />
        ))}
      </Suspense>
    </>
  );
}

type PostSummary = { id: string; planned_date: string; status: string };

// Month to show: the URL's, else the linked post's, else the first with posts to approve, else today's (or the latest).
function pickMonth(all: PostSummary[], monthParam: string | null, focusParam: string | null) {
  if (isYearMonth(monthParam)) return monthParam;
  const focused = isUuid(focusParam) ? all.find((post) => post.id === focusParam) : undefined;
  if (focused) return focused.planned_date.slice(0, 7);
  const firstPending = all.find((post) => post.status === "pending");
  if (firstPending) return firstPending.planned_date.slice(0, 7);
  const today = currentMonth();
  if (all.some((post) => post.planned_date.startsWith(today))) return today;
  return all[all.length - 1].planned_date.slice(0, 7);
}

// Months that have posts (newest first), flagging how many wait for approval.
function monthOptions(all: PostSummary[], selected: string): MonthOption[] {
  const pending = new Map<string, number>([[selected, 0]]);
  for (const post of all) {
    const month = post.planned_date.slice(0, 7);
    pending.set(month, (pending.get(month) ?? 0) + (post.status === "pending" ? 1 : 0));
  }
  return [...pending.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([value, count]) => ({ value, label: count ? `${formatMonth(value)} · ${count} para aprovar` : formatMonth(value) }));
}

// The client's posts for one month (RLS returns only their own, never drafts).
async function ContentView({ monthParam, focusParam }: { monthParam: string | null; focusParam: string | null }) {
  const user = await requireRole("client");
  const supabase = await createClient();

  const [{ data: all }, { data: client }] = await Promise.all([
    supabase.from("posts").select("id, planned_date, status").order("planned_date"),
    supabase.from("clients").select("name, instagram_handle").eq("id", user.clientId ?? "").maybeSingle(),
  ]);
  if (!all?.length) {
    return (
      <EmptyState title="Nenhum conteúdo por enquanto">
        Quando a agência enviar materiais para aprovar, eles aparecem aqui.
      </EmptyState>
    );
  }

  const month = pickMonth(all, monthParam, focusParam);
  const { from, to } = monthRange(month);
  const { data: rows } = await supabase
    .from("posts")
    .select(
      "id, type, status, title, caption, planned_date, decided_at, post_media(kind, storage_path, external_url, position), comments(id, body, is_change_request, created_at, author_id, author:profiles(full_name, email, role))",
    )
    .gte("planned_date", from)
    .lt("planned_date", to)
    .order("planned_date")
    .order("created_at")
    .order("position", { referencedTable: "post_media" });

  const signed = await signMediaPaths(
    supabase,
    (rows ?? []).flatMap((post) => post.post_media.map((media) => media.storage_path).filter(Boolean) as string[]),
  );

  const posts: ClientPost[] = (rows ?? []).map((post) => ({
    id: post.id,
    type: post.type,
    status: post.status,
    title: post.title,
    caption: post.caption,
    plannedDate: post.planned_date,
    decidedLabel: post.decided_at ? formatDateTime(post.decided_at) : null,
    media: post.post_media.flatMap((media): PreviewMedia[] => {
      if (media.kind === "image") {
        const url = media.storage_path ? signed.get(media.storage_path) : undefined;
        return url ? [{ kind: "image", url }] : [];
      }
      const driveId = driveFileId(media.external_url ?? "");
      return driveId ? [{ kind: "video", driveId }] : [];
    }),
    comments: toThreadComments(post.comments, user.id),
  }));

  const handle = client?.instagram_handle?.replace(/^@/, "").trim() || client?.name || user.clientName || "";

  return <ClientBoard posts={posts} months={monthOptions(all, month)} month={month} handle={handle} />;
}
