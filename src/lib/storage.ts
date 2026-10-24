import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { MEDIA_BUCKET } from "@/lib/media";

const SIGNED_URL_SECONDS = 60 * 60;

// Signs private image paths in one call; returns path -> temporary URL.
export async function signMediaPaths(supabase: SupabaseClient<Database>, paths: string[]) {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(unique, SIGNED_URL_SECONDS);
  return new Map((data ?? []).filter((item) => item.signedUrl && item.path).map((item) => [item.path!, item.signedUrl]));
}
