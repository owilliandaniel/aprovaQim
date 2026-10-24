import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathFor, type UserRole } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  clientId: string | null;
  clientName: string | null;
};

// Reads the signed-in user and profile once per request; sends to /login when missing.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, client_id, clients(name)")
    .eq("id", claims.sub)
    .single();
  if (!profile) redirect("/login");

  return {
    id: claims.sub,
    email: claims.email ?? "",
    role: profile.role,
    fullName: profile.full_name,
    clientId: profile.client_id,
    clientName: profile.clients?.name ?? null,
  };
});

// Same as getCurrentUser, but only lets the given role through.
export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}
