"use server";

import { refresh } from "next/cache";
import { requireUserAction } from "@/lib/auth";
import { MAX_COMMENT } from "@/lib/comments";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// Adds a comment to a post (agency or client); RLS checks the post is visible to the author.
export async function addComment(postId: string, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUserAction();
  const text = body.trim();
  if (!isUuid(postId)) return { ok: false, error: "Conteúdo não encontrado." };
  if (!text) return { ok: false, error: "Escreva o comentário." };
  if (text.length > MAX_COMMENT) return { ok: false, error: `O comentário pode ter até ${MAX_COMMENT} caracteres.` };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: user.id, body: text });
  if (error) return { ok: false, error: "Não foi possível enviar o comentário." };

  refresh();
  return { ok: true };
}
