"use server";

import { refresh } from "next/cache";
import { requireUserAction } from "@/lib/auth";
import { MAX_COMMENT } from "@/lib/comments";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

export type Decision = "approved" | "changes_requested";

// Client approves a pending post or asks for changes (the note becomes a change-request comment).
export async function decidePost(
  postId: string,
  decision: Decision,
  note = "",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUserAction();
  if (user.role !== "client") throw new Error("Acesso negado.");
  if (!isUuid(postId) || (decision !== "approved" && decision !== "changes_requested")) {
    return { ok: false, error: "Conteúdo não encontrado." };
  }

  const text = note.trim();
  if (decision === "changes_requested" && !text) return { ok: false, error: "Descreva o que precisa ser ajustado." };
  if (text.length > MAX_COMMENT) return { ok: false, error: `O pedido pode ter até ${MAX_COMMENT} caracteres.` };

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_post", {
    p_post_id: postId,
    p_decision: decision,
    p_note: decision === "changes_requested" ? text : undefined,
  });

  // Refresh either way: a failure usually means the post changed in the meantime.
  refresh();
  if (error) {
    return {
      ok: false,
      error: error.message.includes("not pending")
        ? "Este conteúdo não está mais aguardando aprovação."
        : "Não foi possível registrar sua resposta. Tente novamente.",
    };
  }
  return { ok: true };
}
