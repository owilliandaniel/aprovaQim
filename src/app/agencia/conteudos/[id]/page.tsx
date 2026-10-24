import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/badges";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { signMediaPaths } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { PostEditor, type EditorPost } from "../post-editor";

export default function EditContentPage({ params }: PageProps<"/agencia/conteudos/[id]">) {
  return (
    <>
      <BackLink href="/agencia/conteudos">Voltar para os conteúdos</BackLink>
      <Suspense fallback={<ListSkeleton rows={3} />}>{params.then(({ id }) => <EditContent id={id} />)}</Suspense>
    </>
  );
}

async function EditContent({ id }: { id: string }) {
  await requireRole("agency");
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: post }, { data: clients }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, client_id, type, title, caption, planned_date, status, clients(name), post_media(kind, storage_path, external_url, position), comments(id, body, is_change_request, created_at, author:profiles(full_name, email, role))",
      )
      .eq("id", id)
      .order("position", { referencedTable: "post_media" })
      .order("created_at", { referencedTable: "comments", ascending: false })
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
      {post.comments.length > 0 && (
        <section className="mb-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 font-bold">Comentários do conteúdo</h2>
          <ul className="grid gap-2">
            {post.comments.map((comment) => (
              <li
                key={comment.id}
                className={`rounded-lg px-3 py-2 ${comment.is_change_request ? "bg-danger-bg text-danger" : "bg-pale"}`}
              >
                <div className="text-xs font-semibold">
                  {comment.author?.full_name || comment.author?.email || "Usuário removido"}
                  {comment.is_change_request && " · pedido de ajuste"}
                  {" · "}
                  {formatDateTime(comment.created_at)}
                </div>
                <p className="mt-0.5 whitespace-pre-line text-[13px]">{comment.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <FreshOnNavigate>
        <PostEditor clients={clients ?? []} post={editorPost} />
      </FreshOnNavigate>
    </>
  );
}
