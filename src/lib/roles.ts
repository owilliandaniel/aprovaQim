import type { Enums } from "@/lib/supabase/database.types";

export type UserRole = Enums<"user_role">;

export function isUserRole(value: unknown): value is UserRole {
  return value === "agency" || value === "client";
}

// Landing page for each role.
export function homePathFor(role: UserRole) {
  return role === "agency" ? "/agencia" : "/cliente";
}
