import type { Enums } from "@/lib/supabase/database.types";

type Status = Enums<"post_status">;
export type StatusCounts = Record<Status, number>;

const emptyCounts = (): StatusCounts => ({ draft: 0, pending: 0, approved: 0, changes_requested: 0 });

// Post counts per status, grouped by client id.
export function countByClient(posts: { client_id: string; status: Status }[]) {
  const byClient = new Map<string, StatusCounts>();
  for (const post of posts) {
    const counts = byClient.get(post.client_id) ?? emptyCounts();
    counts[post.status] += 1;
    byClient.set(post.client_id, counts);
  }
  return { get: (clientId: string) => byClient.get(clientId) ?? emptyCounts() };
}
