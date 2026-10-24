import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import type { UserRole } from "@/lib/roles";

const PASSWORD_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Readable random password (no 0/O, 1/l/I).
export function generatePassword(length = 12) {
  return Array.from({ length }, () => PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)]).join("");
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Turns Supabase Auth errors into pt-BR messages.
function accountErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) {
    return "Este e-mail já tem acesso ao AprovaQim.";
  }
  if (error.code === "weak_password") return `Senha fraca: use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return "Não foi possível criar o acesso. Tente novamente.";
}

type NewAccount = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  clientId?: string;
};

// Creates a confirmed login and its profile (the trigger also does it; this doesn't depend on its timing).
export async function createAccount(account: NewAccount): Promise<{ userId: string } | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: { role: account.role, client_id: account.clientId ?? null },
    user_metadata: { full_name: account.fullName },
  });
  if (error || !data.user) return { error: accountErrorMessage(error ?? { message: "" }) };

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      role: account.role,
      client_id: account.clientId ?? null,
      full_name: account.fullName,
      email: account.email,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Não foi possível criar o acesso. Tente novamente." };
  }
  return { userId: data.user.id };
}

export async function setAccountPassword(userId: string, password: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  return error ? { error: "Não foi possível gerar uma nova senha." } : { ok: true as const };
}

// Deleting the auth user also deletes the profile (cascade).
export async function deleteAccount(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error ? { error: "Não foi possível remover o acesso." } : { ok: true as const };
}
