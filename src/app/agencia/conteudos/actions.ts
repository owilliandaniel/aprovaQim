"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyAction } from "@/lib/auth";
import { isYearMonth, monthRange, PAST_DATE_ERROR, todayInBrazil } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { driveFileId, MEDIA_BUCKET, mediaRuleError } from "@/lib/media";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PostInput = {
  id?: string;
  clientId: string;
  type: Enums<"post_type">;
  title: string;
  caption: string;
  plannedDate: string;
};
export type MediaInput = { kind: "image"; storagePath: string } | { kind: "video_link"; externalUrl: string };
type Failure = { ok: false; error: string };

const MAX_TITLE = 120;
const MAX_CAPTION = 2200;

// Creates or updates a post's text fields. Editing an approved post sends it back to draft.
// Editor-only actions don't revalidate: re-rendering mid-submit would reset the editor.
export async function savePost(input: PostInput): Promise<{ ok: true; postId: string } | Failure> {
  const user = await requireAgencyAction();
  const title = input.title.trim();
  const caption = input.caption.trimEnd();

  if (!Constants.public.Enums.post_type.includes(input.type)) return { ok: false, error: "Tipo inválido." };
  if (!title || title.length > MAX_TITLE) return { ok: false, error: `O título precisa ter de 1 a ${MAX_TITLE} caracteres.` };
  if (caption.length > MAX_CAPTION) return { ok: false, error: `A legenda pode ter até ${MAX_CAPTION} caracteres.` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.plannedDate)) return { ok: false, error: "Escolha a data de publicação." };
  // Past days are purged every midnight, so a post can't be planned for one.
  if (input.plannedDate < todayInBrazil()) return { ok: false, error: PAST_DATE_ERROR };

  const supabase = await createClient();
  const fields = { type: input.type, title, caption, planned_date: input.plannedDate };

  if (input.id) {
    if (!isUuid(input.id)) return { ok: false, error: "Conteúdo não encontrado." };
    const { data: current } = await supabase.from("posts").select("status").eq("id", input.id).maybeSingle();
    if (!current) return { ok: false, error: "Conteúdo não encontrado." };

    const backToDraft = current.status === "approved" ? { status: "draft" as const, decided_at: null, decided_by: null } : {};
    const { error } = await supabase.from("posts").update({ ...fields, ...backToDraft }).eq("id", input.id);
    if (error) return { ok: false, error: "Não foi possível salvar." };
    return { ok: true, postId: input.id };
  }

  if (!isUuid(input.clientId)) return { ok: false, error: "Escolha o cliente." };
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...fields, client_id: input.clientId, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Não foi possível criar o conteúdo." };
  return { ok: true, postId: data.id };
}

// Replaces a post's media list (already uploaded images + Drive links) and cleans removed files.
export async function setPostMedia(postId: string, items: MediaInput[]): Promise<{ ok: true } | Failure> {
  await requireAgencyAction();
  if (!isUuid(postId)) return { ok: false, error: "Conteúdo não encontrado." };

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("client_id, post_media(id, storage_path)")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, error: "Conteúdo não encontrado." };

  // Images must live in this post's own folder.
  const folder = `${post.client_id}/${postId}/`;
  const rows = [];
  for (const [position, item] of items.entries()) {
    if (item.kind === "image") {
      if (!item.storagePath.startsWith(folder) || item.storagePath.includes("..")) {
        return { ok: false, error: "Imagem inválida." };
      }
      rows.push({ post_id: postId, kind: "image" as const, storage_path: item.storagePath, position });
    } else {
      if (!driveFileId(item.externalUrl)) return { ok: false, error: "Link do Google Drive inválido." };
      rows.push({ post_id: postId, kind: "video_link" as const, external_url: item.externalUrl.trim(), position });
    }
  }

  if (rows.length) {
    const { error } = await supabase.from("post_media").insert(rows);
    if (error) return { ok: false, error: "Não foi possível salvar as mídias." };
  }
  const oldIds = post.post_media.map((media) => media.id);
  if (oldIds.length) await supabase.from("post_media").delete().in("id", oldIds);

  const kept = new Set(rows.map((row) => row.storage_path).filter(Boolean));
  const removed = post.post_media.map((media) => media.storage_path).filter((path) => path && !kept.has(path)) as string[];
  if (removed.length) await supabase.storage.from(MEDIA_BUCKET).remove(removed);

  return { ok: true };
}

// Sends drafts / changed posts to the client; posts missing media are skipped with a reason.
export async function sendPosts(postIds: string[]): Promise<
  { ok: true; sent: number; blocked: { title: string; reason: string }[] } | Failure
> {
  await requireAgencyAction();
  const ids = postIds.filter(isUuid);
  if (!ids.length) return { ok: true, sent: 0, blocked: [] };

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, type, status, post_media(kind)")
    .in("id", ids)
    .in("status", ["draft", "changes_requested"]);

  const ready: string[] = [];
  const blocked: { title: string; reason: string }[] = [];
  for (const post of posts ?? []) {
    const reason = mediaRuleError(post.type, post.post_media.map((media) => media.kind));
    if (reason) blocked.push({ title: post.title, reason });
    else ready.push(post.id);
  }

  if (ready.length) {
    const { error } = await supabase
      .from("posts")
      .update({ status: "pending", sent_at: new Date().toISOString(), decided_at: null, decided_by: null })
      .in("id", ready);
    if (error) return { ok: false, error: "Não foi possível enviar para aprovação." };
  }

  return { ok: true, sent: ready.length, blocked };
}

// Form action: sends one post.
export async function sendPostAction(postId: string) {
  await sendPosts([postId]);
  revalidatePath("/", "layout");
}

// Form action: sends every draft of a client (optionally only one month).
export async function sendDraftsAction(clientId: string, month: string | null) {
  await requireAgencyAction();
  if (!isUuid(clientId)) return;

  const supabase = await createClient();
  let query = supabase.from("posts").select("id").eq("client_id", clientId).eq("status", "draft");
  if (isYearMonth(month)) {
    const { from, to } = monthRange(month);
    query = query.gte("planned_date", from).lt("planned_date", to);
  }
  const { data } = await query;
  await sendPosts((data ?? []).map((post) => post.id));
  revalidatePath("/", "layout");
}

// Form action: deletes a post and its image files.
export async function deletePostAction(postId: string) {
  await requireAgencyAction();
  if (!isUuid(postId)) return;

  const supabase = await createClient();
  const { data: media } = await supabase.from("post_media").select("storage_path").eq("post_id", postId);
  const paths = (media ?? []).map((item) => item.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);

  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/", "layout");
}
