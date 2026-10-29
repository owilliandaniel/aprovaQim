import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PostCalendar, type CalendarPost } from "@/components/post-calendar";
import { CalendarSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { calendarDays } from "@/lib/calendar";
import { isYearMonth, todayInBrazil } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { CalendarClientFilter } from "./client-filter";

export default function AgencyCalendarPage({ searchParams }: PageProps<"/agencia/calendario">) {
  return (
    <>
      <PageHeader eyebrow="Calendário" title="Calendário" subtitle="Os conteúdos dos clientes pela data de postagem." />
      <Suspense fallback={<CalendarSkeleton />}>
        {searchParams.then(({ mes, cliente }) => (
          <CalendarView month={isYearMonth(mes) ? mes : null} client={isUuid(cliente) ? cliente : null} />
        ))}
      </Suspense>
    </>
  );
}

// Every post in the visible weeks (all statuses), optionally for one client.
async function CalendarView({ month: monthParam, client }: { month: string | null; client: string | null }) {
  await requireRole("agency");
  const supabase = await createClient();
  const today = todayInBrazil();
  const month = monthParam ?? today.slice(0, 7);
  const days = calendarDays(month);

  let query = supabase
    .from("posts")
    .select("id, type, status, title, planned_date, clients(name)")
    .gte("planned_date", days[0])
    .lte("planned_date", days[days.length - 1])
    .order("planned_date")
    .order("created_at");
  if (client) query = query.eq("client_id", client);

  const [{ data: clients }, { data: rows }] = await Promise.all([
    supabase.from("clients").select("id, name, active").order("name"),
    query,
  ]);

  const posts: CalendarPost[] = (rows ?? []).map((post) => ({
    id: post.id,
    type: post.type,
    status: post.status,
    title: post.title,
    date: post.planned_date,
    clientName: client ? null : (post.clients?.name ?? null),
  }));

  return (
    <PostCalendar
      area="agency"
      month={month}
      today={today}
      posts={posts}
      toolbar={<CalendarClientFilter clients={clients ?? []} value={client} />}
    />
  );
}
