import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationCenter } from "./notification-center";

// Bell with the unread count; the list, live updates and "mark as read" run in the browser.
export async function NotificationBell() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return <NotificationCenter userId={user.id} role={user.role} initialUnread={count ?? 0} />;
}

export function NotificationBellSkeleton() {
  return (
    <span className="grid size-11 place-items-center text-ink md:size-9">
      <Bell size={20} strokeWidth={1.8} />
    </span>
  );
}
