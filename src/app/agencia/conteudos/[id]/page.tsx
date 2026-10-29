import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/badges";
import { CommentThread } from "@/components/comment-thread";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { toThreadComments } from "@/lib/comments";
import { isUuid } from "@/lib/ids";
import { signMediaPaths } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { PostEditor, type EditorPost } from "../post-editor";

const listBackLink = <BackLink href="/agencia/conteudos">Voltar para os conteúdos</BackLink>;

// The calendar passes its own URL in ?voltar= so the page can return there; anything else is ignored.
function calendarReturn(value: unknown) {
  return typeof value === "string" && /^\/agencia\/calendario(\?|$)/.test(value) ? value : null;
}

export default function EditContentPage({ params, searchParams }: PageProps<"/agencia/conteudos/[id]">) {
  const returnTo = searchParams.then(({ voltar }) => calendarReturn(voltar));
  return (
    <>
      <Suspense fallback={listBackLink}>
        {returnTo.then((to) => (to ? <BackLink href={to}>Voltar para o calendário</BackLink> : listBackLink))}
      </Suspense>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        {Promise.all([params, returnTo]).then(([{ id }, to]) => <EditContent id={id} returnTo={to} />)}
      </Suspense>
    </>
  );
}

async function EditContent({ id, returnTo }: { id: string; returnTo: string | null }) {
  const user = await requireRole("agency");
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: post }, { data: clients }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, client_id, type, title, caption, planned_date, status, clients(name), post_media(kind, storage_path, external_url, position), comments(id, body, is_change_request, created_at, author_id, author:profiles(full_name, email, role))",
      )
      .eq("id", id)
      .order("position", { referencedTable: "post_media" })
      .maybeSingle(),
    supabase.from("clients").select("id, name, active").order("name"),
  ]);
  if (!post) notFound();

  const signed = await signMediaPaths(
    supabase,
    post.post_media.map((media) => media.storage_path).filter(Boolean) as string[],
  );
  const editorPost: EditorPost = {
    id: post.id,
    clientId: post.client_id,
    type: post.type,
    title: post.title,
    caption: post.caption,
    plannedDate: post.planned_date,
    status: post.status,
    media: post.post_media.map((media) =>
      media.kind === "image"
        ? { kind: "image", storagePath: media.storage_path!, url: signed.get(media.storage_path!) ?? "" }
        : { kind: "video_link", externalUrl: media.external_url ?? "" },
    ),
  };

  return (
    <>
      <PageHeader
        eyebrow={post.clients?.name ?? "Conteúdo"}
        title="Editar conteúdo"
        action={<StatusBadge status={post.status} />}
      />
      {/* The client can't see drafts, so a draft only shows the thread if it already has comments. */}
      {(post.status !== "draft" || post.comments.length > 0) && (
        <section className="mb-4 rounded-2xl border border-line bg-white p-5">
          <CommentThread postId={post.id} comments={toThreadComments(post.comments, user.id)} />
        </section>
      )}
      <FreshOnNavigate>
        <PostEditor clients={clients ?? []} post={editorPost} returnTo={returnTo} />
      </FreshOnNavigate>
    </>
  );
}
