"use client";

import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clapperboard,
  GalleryHorizontal,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { statusColors } from "@/components/badges";
import { buttonSecondary, buttonSmall } from "@/components/ui";
import { calendarDays, shiftMonth, weekday } from "@/lib/calendar";
import { formatDateLong, formatMonth } from "@/lib/format";
import { postStatusLabel, postTypeLabel } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";

type PostType = Enums<"post_type">;
type PostStatus = Enums<"post_status">;

export type CalendarPost = {
  id: string;
  type: PostType;
  status: PostStatus;
  title: string;
  date: string;
  // Set when the calendar mixes several clients (agency without a client filter).
  clientName: string | null;
};

const typeIcons: Record<PostType, LucideIcon> = {
  feed: ImageIcon,
  carousel: GalleryHorizontal,
  reels: Clapperboard,
  stories: CircleDashed,
};

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEKDAYS_LONG = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Where each side's calendar lives and where a post opens from it (`back` is the calendar URL).
const areas: Record<"agency" | "client", { path: string; postHref: (id: string, back: string) => string; statuses: PostStatus[] }> = {
  agency: {
    path: "/agencia/calendario",
    postHref: (id, back) => `/agencia/conteudos/${id}?voltar=${encodeURIComponent(back)}`,
    statuses: ["draft", "pending", "changes_requested", "approved"],
  },
  client: {
    path: "/cliente/calendario",
    postHref: (id) => `/cliente?conteudo=${id}&de=calendario`,
    statuses: ["pending", "changes_requested", "approved"],
  },
};

const arrowClass = "grid size-11 place-items-center rounded-lg text-[#4b2580] hover:bg-pale md:size-9";
const emptyClass = "rounded-xl border border-dashed border-line bg-white/60 px-4 py-6 text-center text-sm text-muted";

const countLabel = (count: number) => (count === 0 ? "nenhum conteúdo" : count === 1 ? "1 conteúdo" : `${count} conteúdos`);

// Teams-style month view shared by the agency and the client. Larger screens list each post in its day;
// phones show icons per day and the tapped day's posts below. Month and day live in the URL (?mes=&dia=).
export function PostCalendar({
  area,
  month,
  today,
  posts,
  toolbar,
}: {
  area: "agency" | "client";
  month: string;
  today: string;
  posts: CalendarPost[];
  toolbar?: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { path, postHref, statuses } = areas[area];

  const days = calendarDays(month);
  const postsByDay = new Map<string, CalendarPost[]>();
  for (const post of posts) postsByDay.set(post.date, [...(postsByDay.get(post.date) ?? []), post]);

  // The URL's day, else today, else the month's first day with posts.
  const dayParam = searchParams.get("dia");
  const selected =
    dayParam && days.includes(dayParam)
      ? dayParam
      : today.startsWith(month)
        ? today
        : (days.find((day) => day.startsWith(month) && postsByDay.has(day)) ?? null);
  const selectedPosts = selected ? (postsByDay.get(selected) ?? []) : [];

  // Calendar URL with some params changed (null removes one).
  function hrefWith(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `${path}?${params}`;
  }
  const here = hrefWith({ mes: month, dia: selected });

  const goTo = (target: string, day: string | null = null) =>
    startTransition(() => router.push(hrefWith({ mes: target, dia: day }), { scroll: false }));
  // Picking a day only rewrites the URL (Next syncs useSearchParams, no server round trip).
  const selectDay = (day: string) => window.history.replaceState({}, "", hrefWith({ dia: day }));
  const goToday = () => (today.startsWith(month) ? selectDay(today) : goTo(today.slice(0, 7), today));

  // grid-cols-1 (not an auto column) lets long titles truncate instead of widening the page.
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={goToday} className={`${buttonSecondary} ${buttonSmall} mr-1`}>
            Hoje
          </button>
          <button type="button" onClick={() => goTo(shiftMonth(month, -1))} aria-label="Mês anterior" className={arrowClass}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => goTo(shiftMonth(month, 1))} aria-label="Próximo mês" className={arrowClass}>
            <ChevronRight size={20} />
          </button>
          <h2 className="ml-1 text-lg font-bold tracking-[-0.4px] whitespace-nowrap md:text-xl">{formatMonth(month)}</h2>
        </div>
        {toolbar}
      </div>

      <div className={`overflow-hidden rounded-2xl border border-line bg-white transition-opacity ${pending ? "opacity-60" : ""}`}>
        <div className="grid grid-cols-7 border-b border-line bg-panel" aria-hidden>
          {WEEKDAYS.map((name) => (
            <div key={name} className="py-2 text-center text-[11px] font-semibold text-muted uppercase md:px-3 md:text-left md:text-xs">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayPosts = postsByDay.get(day) ?? [];
            const outside = !day.startsWith(month);
            const number = <DayNumber day={day} today={day === today} outside={outside} />;
            return (
              <div
                key={day}
                className={`min-w-0 border-line ${index % 7 ? "border-l" : ""} ${index >= 7 ? "border-t" : ""} ${outside ? "bg-[#fbfafd]" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={day === selected}
                  aria-current={day === today ? "date" : undefined}
                  aria-label={`${formatDateLong(day)}: ${countLabel(dayPosts.length)}`}
                  className={`flex min-h-14 w-full flex-col items-center gap-1 pt-1.5 pb-1 md:hidden ${day === selected ? "bg-chip" : ""}`}
                >
                  {number}
                  <DayIcons posts={dayPosts} />
                </button>
                <div className="hidden min-h-28 p-1.5 md:block">
                  {number}
                  {dayPosts.length > 0 && (
                    <ul className="mt-1 grid grid-cols-1 gap-1">
                      {dayPosts.map((post) => (
                        <li key={post.id}>
                          <EventLink post={post} href={postHref(post.id, here)} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="md:hidden" aria-live="polite">
        {selected ? (
          <>
            <h3 className="mb-2 text-sm font-bold">
              {WEEKDAYS_LONG[weekday(selected)]}, {formatDateLong(selected)}
            </h3>
            {selectedPosts.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2">
                {selectedPosts.map((post) => (
                  <li key={post.id}>
                    <DayRow post={post} href={postHref(post.id, here)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={emptyClass}>Nenhum conteúdo neste dia.</p>
            )}
          </>
        ) : (
          <p className={emptyClass}>Toque em um dia para ver os conteúdos.</p>
        )}
      </section>

      <Legend statuses={statuses} />
    </div>
  );
}

function DayNumber({ day, today, outside }: { day: string; today: boolean; outside: boolean }) {
  return (
    <span
      className={`grid size-7 place-items-center rounded-full text-[13px] font-semibold ${
        today ? "bg-brand text-white" : outside ? "text-[#b5adc6]" : "text-ink"
      }`}
    >
      {Number(day.slice(8))}
    </span>
  );
}

// Phones: up to three type icons in their status color; more posts collapse into "+N".
function DayIcons({ posts }: { posts: CalendarPost[] }) {
  if (!posts.length) return null;
  const shown = posts.length > 3 ? posts.slice(0, 2) : posts;
  return (
    <span className="flex items-center gap-px" aria-hidden>
      {shown.map((post) => {
        const Icon = typeIcons[post.type];
        return <Icon key={post.id} size={13} strokeWidth={2.2} className={statusColors[post.status].text} />;
      })}
      {posts.length > shown.length && <span className="text-[10px] font-bold text-muted">+{posts.length - shown.length}</span>}
    </span>
  );
}

// Larger screens: one post inside its day, striped in the status color.
function EventLink({ post, href }: { post: CalendarPost; href: string }) {
  const Icon = typeIcons[post.type];
  const colors = statusColors[post.status];
  return (
    <Link
      href={href}
      title={post.title}
      className={`block rounded-md border-l-[3px] px-1.5 py-1 text-xs leading-tight hover:brightness-[0.97] ${colors.soft} ${colors.border}`}
    >
      <span className="flex items-center gap-1.5 font-medium text-ink">
        <Icon size={13} className={`shrink-0 ${colors.text}`} />
        <span className="truncate">{post.title}</span>
      </span>
      {post.clientName && <span className="mt-0.5 block truncate text-[11px] text-muted">{post.clientName}</span>}
      <span className="sr-only">
        {" "}
        ({postTypeLabel[post.type]}, {postStatusLabel[post.status]})
      </span>
    </Link>
  );
}

// Phones: a row in the selected day's list.
function DayRow({ post, href }: { post: CalendarPost; href: string }) {
  const Icon = typeIcons[post.type];
  const colors = statusColors[post.status];
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 active:bg-pale">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${colors.soft} ${colors.text}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{post.title}</span>
        <span className="block truncate text-xs text-muted">
          {postTypeLabel[post.type]} · {postStatusLabel[post.status]}
          {post.clientName && ` · ${post.clientName}`}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}

// Which icon is which type and which color is which status.
function Legend({ statuses }: { statuses: PostStatus[] }) {
  return (
    <div className="grid gap-2 text-xs text-muted md:flex md:flex-wrap md:gap-x-8">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Tipos de conteúdo">
        {(Object.keys(typeIcons) as PostType[]).map((type) => {
          const Icon = typeIcons[type];
          return (
            <li key={type} className="flex items-center gap-1.5">
              <Icon size={14} className="text-brand" /> {postTypeLabel[type]}
            </li>
          );
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Status">
        {statuses.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${statusColors[status].solid}`} /> {postStatusLabel[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
