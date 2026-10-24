"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathFor, isUserRole } from "@/lib/roles";

export type SignInState = { error: string | null };

// Email + password login; rejects accounts that have no role assigned.
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "E-mail ou senha incorretos." };

  const role = data.user.app_metadata?.role;
  if (!isUserRole(role)) {
    await supabase.auth.signOut();
    return { error: "Sua conta ainda não tem acesso. Fale com a agência." };
  }

  redirect(homePathFor(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
