import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function hasAdminKey() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

// Supabase client with the secret key: bypasses RLS, server only.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY não está configurada no servidor.");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
