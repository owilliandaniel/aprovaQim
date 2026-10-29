import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PostCalendar, type CalendarPost } from "@/components/post-calendar";
import { CalendarSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { calendarDays } from "@/lib/calendar";
import { isYearMonth, todayInBrazil } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default function ClientCalendarPage({ searchParams }: PageProps<"/cliente/calendario">) {
  return (
    <>
      <PageHeader eyebrow="Calendário" title="Calendário" subtitle="Seus conteúdos organizados por data." />
      <Suspense fallback={<CalendarSkeleton />}>
        {searchParams.then(({ mes }) => (
          <CalendarView month={isYearMonth(mes) ? mes : null} />
        ))}
      </Suspense>
    </>
  );
}

// The client's posts in the visible weeks (RLS returns only their own, never drafts).
async function CalendarView({ month: monthParam }: { month: string | null }) {
  await requireRole("client");
  const supabase = await createClient();
  const today = todayInBrazil();
  const month = monthParam ?? today.slice(0, 7);
  const days = calendarDays(month);

  const { data: rows } = await supabase
    .from("posts")
    .select("id, type, status, title, planned_date")
    .gte("planned_date", days[0])
    .lte("planned_date", days[days.length - 1])
    .order("planned_date")
    .order("created_at");

  const posts: CalendarPost[] = (rows ?? []).map((post) => ({
    id: post.id,
    type: post.type,
    status: post.status,
    title: post.title,
    date: post.planned_date,
    clientName: null,
  }));

  return <PostCalendar area="client" month={month} today={today} posts={posts} />;
}
