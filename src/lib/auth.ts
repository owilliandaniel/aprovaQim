import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homePathFor, type UserRole } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  clientId: string | null;
  clientName: string | null;
  // False when the user's company was deactivated by the agency.
  clientActive: boolean;
};

// Reads the session and profile; null when signed out or without a profile.
async function loadUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, client_id, clients(name, active)")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: profile.email || claims.email || "",
    role: profile.role,
    fullName: profile.full_name,
    clientId: profile.client_id,
    clientName: profile.clients?.name ?? null,
    clientActive: profile.role === "agency" || profile.clients?.active === true,
  };
}

// For pages: reads the user once per request; signs out accounts that lost access.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // Session checks compare token expiry with the clock, so only run at request time.
  await connection();
  const user = await loadUser();
  if (!user) redirect("/auth/sair");
  if (!user.clientActive) redirect("/auth/sair?motivo=suspenso");
  return user;
});

// Same as getCurrentUser, but only lets the given role through.
export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}

// For Server Actions: returns the signed-in (active) user or throws.
export async function requireUserAction() {
  const user = await loadUser();
  if (!user?.clientActive) throw new Error("Acesso negado.");
  return user;
}

// For Server Actions: returns the agency user or throws.
export async function requireAgencyAction() {
  const user = await loadUser();
  if (user?.role !== "agency") throw new Error("Acesso negado.");
  return user;
}
