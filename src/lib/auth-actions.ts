"use server";

import { redirect } from "next/navigation";
import { requireUserAction } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { createClient } from "@/lib/supabase/server";
import { homePathFor, isUserRole } from "@/lib/roles";

// The email comes back with errors so the form keeps it (React resets forms after actions).
export type SignInState = { error: string | null; email?: string };
export type PasswordState = { error?: string; success?: string };

const SUSPENDED = "O acesso da sua empresa está suspenso. Fale com a agência.";

// Email + password login; rejects accounts without a role and companies that were deactivated.
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "E-mail ou senha incorretos.", email };

  const role = data.user.app_metadata?.role;
  if (!isUserRole(role)) {
    await supabase.auth.signOut();
    return { error: "Sua conta ainda não tem acesso. Fale com a agência.", email };
  }

  if (role === "client") {
    const { data: profile } = await supabase.from("profiles").select("clients(active)").eq("id", data.user.id).single();
    if (profile?.clients?.active !== true) {
      await supabase.auth.signOut();
      return { error: SUSPENDED, email };
    }
  }

  redirect(homePathFor(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Lets the signed-in person pick a new password (checks the current one first).
export async function changeOwnPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUserAction();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < MIN_PASSWORD_LENGTH) return { error: `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (next !== confirm) return { error: "A confirmação não é igual à nova senha." };
  if (next === current) return { error: "A nova senha precisa ser diferente da atual." };

  const supabase = await createClient();
  const { error: wrongCurrent } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (wrongCurrent) return { error: "A senha atual está incorreta." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Não foi possível trocar a senha. Tente novamente." };
  return { success: "Senha alterada." };
}
