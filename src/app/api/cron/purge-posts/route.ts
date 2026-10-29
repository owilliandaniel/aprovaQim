import { todayInBrazil } from "@/lib/format";
import { MEDIA_BUCKET } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";

const BATCH = 100;

// Vercel Cron, daily at 00:00 in Brazil: deletes every post whose day is over, whatever its status.
// Comments and notifications go with the post (cascade); Storage files need the API, so they go first.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, post_media(storage_path)")
    .lt("planned_date", todayInBrazil());
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Stop before touching rows if a file can't be removed; the next run retries with the paths still known.
  const paths = posts.flatMap((post) => post.post_media.map((media) => media.storage_path).filter(Boolean)) as string[];
  for (let i = 0; i < paths.length; i += BATCH) {
    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove(paths.slice(i, i + BATCH));
    if (storageError) return Response.json({ error: storageError.message }, { status: 500 });
  }

  const ids = posts.map((post) => post.id);
  for (let i = 0; i < ids.length; i += BATCH) {
    const { error: deleteError } = await supabase.from("posts").delete().in("id", ids.slice(i, i + BATCH));
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  }

  return Response.json({ posts: ids.length, files: paths.length });
}
