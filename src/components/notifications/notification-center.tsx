"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCircle2, MessageCircle, PencilLine, Send, type LucideIcon } from "lucide-react";
import { buttonSecondary, buttonSmall } from "@/components/ui";
import { NOTIFICATION_COLUMNS, toNotificationItems, type NotificationItem, type NotificationRow } from "@/lib/notifications";
import type { UserRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";

const LIST_SIZE = 30;
// Below Tailwind's md breakpoint the list is a full-screen sheet.
const PHONE_QUERY = "(max-width: 767px)";

const icons: Record<Enums<"notification_type">, { icon: LucideIcon; className: string }> = {
  post_sent: { icon: Send, className: "bg-warn-bg text-warn" },
  post_approved: { icon: CheckCircle2, className: "bg-ok-bg text-ok" },
  changes_requested: { icon: PencilLine, className: "bg-danger-bg text-danger" },
  new_comment: { icon: MessageCircle, className: "bg-chip text-brand" },
};

type Props = { userId: string; role: UserRole; initialUnread: number };

// Bell + unread badge, kept live with Supabase Realtime. Tapping it opens the list:
// a dropdown on larger screens, a full-screen sheet (closed by the back gesture) on phones.
export function NotificationCenter({ userId, role, initialUnread }: Props) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [unread, setUnread] = useState(initialUnread);
  // null until the list first loads; `now` is when it loaded, for the "há 5 min" labels.
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [now, setNow] = useState(0);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const bell = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const listWanted = useRef(false);
  const sheetEntry = useRef(false);
  const afterPop = useRef<(() => void) | null>(null);

  const loadCount = useCallback(async () => {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (!error) setUnread(count ?? 0);
  }, [supabase, userId]);

  const loadList = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIST_SIZE);
    setFailed(Boolean(error));
    if (data) {
      setRows(data);
      setNow(Date.now());
    }
  }, [supabase, userId]);

  // Refetches the count, and the list once it has been opened.
  const sync = useCallback(() => {
    void loadCount();
    if (listWanted.current) void loadList();
  }, [loadCount, loadList]);

  // New notifications and reads from other tabs arrive live; a batch send fires many events, so wait a beat.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, 300);
    };
    const changes = { schema: "public", table: "notifications", filter: `user_id=eq.${userId}` };
    // Unique topic: Realtime hands back an existing channel with the same name, which breaks remounts.
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", ...changes }, soon)
      .on("postgres_changes", { event: "UPDATE", ...changes }, soon)
      // Also fires after reconnecting: catch up on what was missed meanwhile.
      .subscribe((status) => {
        if (status === "SUBSCRIBED") soon();
      });
    const onVisible = () => {
      if (document.visibilityState === "visible") soon();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, sync]);

  function show() {
    listWanted.current = true;
    void loadList();
    setOpen(true);
    // Phones: an extra history entry lets the back gesture close the sheet.
    if (window.matchMedia(PHONE_QUERY).matches) {
      window.history.pushState({ aqSheet: true }, "", window.location.href);
      sheetEntry.current = true;
    }
  }

  // Closes the list; on phones resolves once the sheet's history entry is gone.
  const close = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (sheetEntry.current) {
          afterPop.current = resolve;
          window.history.back();
        } else {
          setOpen(false);
          resolve();
        }
      }),
    [],
  );

  // While open: focus the list; outside taps, Escape and back close it; focus returns to the bell.
  useEffect(() => {
    if (!open) return;
    const bellButton = bell.current;
    panel.current?.focus({ preventScroll: true });

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !bellButton?.contains(target)) void close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void close();
    };
    const onPop = () => {
      sheetEntry.current = false;
      setOpen(false);
      afterPop.current?.();
      afterPop.current = null;
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      bellButton?.focus({ preventScroll: true });
    };
  }, [open, close]);

  // The phone sheet covers the page, so the page behind it shouldn't scroll.
  useLayoutEffect(() => {
    if (!open || !window.matchMedia(PHONE_QUERY).matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Optimistic: list and badge update at once; a failed write refetches the real state.
  async function markRead(ids: string[] | "all") {
    const readAt = new Date().toISOString();
    const hit = (row: NotificationRow) => !row.read_at && (ids === "all" || ids.includes(row.id));
    setRows((current) => current && current.map((row) => (hit(row) ? { ...row, read_at: readAt } : row)));
    setUnread((count) => (ids === "all" ? 0 : Math.max(0, count - ids.length)));

    let query = supabase.from("notifications").update({ read_at: readAt }).eq("user_id", userId).is("read_at", null);
    if (ids !== "all") query = query.in("id", ids);
    const { error } = await query;
    if (error) sync();
  }

  async function openItem(item: NotificationItem) {
    if (item.unreadIds.length) void markRead(item.unreadIds);
    await close();
    // Already there (e.g. a new comment on the post being edited): reload its data instead.
    if (item.href === window.location.pathname + window.location.search) router.refresh();
    else router.push(item.href);
  }

  const items = rows && toNotificationItems(rows, role, now);
  const label = unread ? `Notificações, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Notificações";

  return (
    <>
      <button
        ref={bell}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open) void close();
          else show();
        }}
        className={`relative grid size-11 place-items-center rounded-lg text-ink hover:bg-pale md:size-9 ${open ? "bg-pale" : ""}`}
      >
        <Bell size={20} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] leading-none font-bold text-white ring-2 ring-[#faf8fd] md:-top-1 md:-right-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Portaled: the header's backdrop blur would trap a fixed sheet inside it. */}
      {open &&
        createPortal(
          <section
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="notifications-title"
            className="fixed inset-0 z-50 flex flex-col bg-white outline-none md:absolute md:inset-auto md:top-[62px] md:right-8 md:max-h-[min(560px,calc(100dvh-80px))] md:w-[380px] md:overflow-hidden md:rounded-xl md:border md:border-line md:shadow-[0_22px_80px_#170d2a30]"
          >
            <div className="flex shrink-0 items-center gap-1 border-b border-line px-1 pt-[env(safe-area-inset-top)] md:py-1 md:pt-1 md:pl-4">
              <button
                type="button"
                onClick={() => void close()}
                aria-label="Fechar"
                className="grid size-11 shrink-0 place-items-center rounded-lg text-[#4b2580] md:hidden"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 id="notifications-title" className="flex-1 text-base font-bold md:text-[15px]">
                Notificações
              </h2>
              <button
                type="button"
                onClick={() => void markRead("all")}
                disabled={!unread}
                className="min-h-11 rounded-lg px-3 text-[13px] font-semibold text-brand hover:bg-pale disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:bg-transparent md:min-h-9"
              >
                Marcar todas como lidas
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              {items ? (
                items.length ? (
                  <ul className="divide-y divide-line">
                    {items.map((item) => (
                      <NotificationLine key={item.key} item={item} onOpen={() => void openItem(item)} />
                    ))}
                  </ul>
                ) : (
                  <EmptyList role={role} />
                )
              ) : failed ? (
                <div className="px-6 py-12 text-center text-muted">
                  <p>Não foi possível carregar as notificações.</p>
                  <button type="button" onClick={() => void loadList()} className={`${buttonSecondary} ${buttonSmall} mt-3`}>
                    Tentar de novo
                  </button>
                </div>
              ) : (
                <LoadingList />
              )}
            </div>
          </section>,
          document.body,
        )}
    </>
  );
}

function NotificationLine({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const { icon: Icon, className } = icons[item.type];
  const unread = item.unreadIds.length > 0;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-pale ${unread ? "bg-[#faf6ff]" : ""}`}
      >
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${className}`}>
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`line-clamp-3 leading-snug break-words ${unread ? "text-ink" : "text-[#5f5576]"}`}>
            <strong className="font-semibold">{item.lead}</strong> {item.rest}
          </span>
          <span className="mt-1 block text-xs text-muted">{item.meta}</span>
        </span>
        {unread && (
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-2">
            <span className="sr-only">Não lida</span>
          </span>
        )}
      </button>
    </li>
  );
}

function EmptyList({ role }: { role: UserRole }) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-pale text-brand">
        <Bell size={22} />
      </span>
      <p className="mt-3 font-bold">Nenhuma notificação por enquanto</p>
      <p className="mx-auto mt-1 max-w-72 text-muted">
        {role === "client"
          ? "Avisamos aqui quando a agência enviar conteúdos para aprovar ou comentar."
          : "Avisamos aqui quando um cliente aprovar, pedir ajuste ou comentar."}
      </p>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="grid gap-4 p-4" aria-label="Carregando">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <span className="size-9 shrink-0 animate-pulse rounded-full bg-line" />
          <span className="grid flex-1 gap-2 py-1">
            <span className="h-3 animate-pulse rounded bg-line" />
            <span className="h-3 w-1/3 animate-pulse rounded bg-line" />
          </span>
        </div>
      ))}
    </div>
  );
}
