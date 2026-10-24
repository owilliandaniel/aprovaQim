"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgencyAction } from "@/lib/auth";
import { deleteAccount } from "@/lib/accounts";
import { MEDIA_BUCKET } from "@/lib/media";
import { hasAdminKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccessFormState } from "../access-actions";

export async function updateClient(clientId: string, _prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  await requireAgencyAction();
  const name = String(formData.get("name") ?? "").trim();
  const handle = String(formData.get("instagram") ?? "").trim().replace(/^@+/, "");
  if (!name) return { error: "Informe o nome da empresa." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ name, instagram_handle: handle ? `@${handle}` : null })
    .eq("id", clientId);
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { success: "Dados salvos." };
}

// Deletes the client's logins, media files and the client itself (posts go by cascade).
export async function deleteClient(clientId: string): Promise<AccessFormState> {
  await requireAgencyAction();
  const supabase = await createClient();

  const { data: accesses } = await supabase.from("profiles").select("id").eq("client_id", clientId);
  if (accesses?.length && !hasAdminKey()) {
    return { error: "Falta configurar a SUPABASE_SECRET_KEY no servidor para remover os acessos do cliente." };
  }
  for (const access of accesses ?? []) {
    const result = await deleteAccount(access.id);
    if ("error" in result) return { error: result.error };
  }

  const { data: media } = await supabase
    .from("post_media")
    .select("storage_path, posts!inner(client_id)")
    .eq("posts.client_id", clientId)
    .not("storage_path", "is", null);
  const paths = (media ?? []).map((item) => item.storage_path!);
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);

  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { error: "Não foi possível excluir o cliente." };

  revalidatePath("/", "layout");
  redirect("/agencia/clientes");
}
