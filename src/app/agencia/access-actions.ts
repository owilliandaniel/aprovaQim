"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyAction } from "@/lib/auth";
import {
  createAccount,
  deleteAccount,
  generatePassword,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  setAccountPassword,
} from "@/lib/accounts";
import { hasAdminKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AccessFormState = {
  error?: string;
  success?: string;
  credentials?: { email: string; password: string };
  clientId?: string;
};

const NO_KEY_ERROR = "Falta configurar a SUPABASE_SECRET_KEY no servidor para gerenciar acessos.";

// Reads the email/password/name fields used by every "new access" form.
function readAccessFields(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const typed = String(formData.get("password") ?? "").trim();
  const password = typed || generatePassword();

  if (!isValidEmail(email)) return { error: "Informe um e-mail válido." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (!hasAdminKey()) return { error: NO_KEY_ERROR };
  return { email, fullName, password };
}

// Creates a client company and its first login together.
export async function createClientWithAccess(_prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  await requireAgencyAction();
  const name = String(formData.get("name") ?? "").trim();
  const handle = String(formData.get("instagram") ?? "").trim().replace(/^@+/, "");
  if (!name) return { error: "Informe o nome da empresa." };

  const access = readAccessFields(formData);
  if ("error" in access) return access;

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .insert({ name, instagram_handle: handle ? `@${handle}` : null })
    .select("id")
    .single();
  if (error || !client) return { error: "Não foi possível cadastrar o cliente." };

  const account = await createAccount({ ...access, role: "client", clientId: client.id });
  if ("error" in account) {
    await supabase.from("clients").delete().eq("id", client.id);
    return { error: account.error };
  }

  revalidatePath("/", "layout");
  return {
    success: `${name} cadastrado.`,
    credentials: { email: access.email, password: access.password },
    clientId: client.id,
  };
}

// Adds another login to an existing client company.
export async function addClientAccess(clientId: string, _prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  await requireAgencyAction();
  const access = readAccessFields(formData);
  if ("error" in access) return access;

  const account = await createAccount({ ...access, role: "client", clientId });
  if ("error" in account) return { error: account.error };

  revalidatePath("/", "layout");
  return { success: "Acesso criado.", credentials: { email: access.email, password: access.password } };
}

// Adds a person to the agency team.
export async function addTeamMember(_prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  await requireAgencyAction();
  if (!String(formData.get("fullName") ?? "").trim()) return { error: "Informe o nome da pessoa." };
  const access = readAccessFields(formData);
  if ("error" in access) return access;

  const account = await createAccount({ ...access, role: "agency" });
  if ("error" in account) return { error: account.error };

  revalidatePath("/", "layout");
  return { success: "Pessoa adicionada à equipe.", credentials: { email: access.email, password: access.password } };
}

// Generates a new password for any login and returns it once.
export async function resetAccessPassword(userId: string): Promise<AccessFormState> {
  await requireAgencyAction();
  if (!hasAdminKey()) return { error: NO_KEY_ERROR };

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();
  if (!profile) return { error: "Acesso não encontrado." };

  const password = generatePassword();
  const result = await setAccountPassword(userId, password);
  if ("error" in result) return { error: result.error };
  return { credentials: { email: profile.email, password } };
}

// Removes a login; nobody removes themselves, so the agency never ends up empty.
export async function removeAccess(userId: string): Promise<AccessFormState> {
  const me = await requireAgencyAction();
  if (userId === me.id) return { error: "Você não pode remover o seu próprio acesso." };
  if (!hasAdminKey()) return { error: NO_KEY_ERROR };

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!profile) return { error: "Acesso não encontrado." };

  const result = await deleteAccount(userId);
  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");
  return { success: "Acesso removido." };
}
