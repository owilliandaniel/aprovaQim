"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Toast, type ToastMessage } from "@/components/toast";
import { inputClass } from "@/components/ui";
import type { Enums } from "@/lib/supabase/database.types";
import { decidePost } from "./actions";
import { ClientPostCard } from "./post-card";
import { PostModal } from "./post-modal";
import type { ClientPost, MonthOption } from "./types";

type PostType = Enums<"post_type">;

const tabs: { value: string | null; label: string; match: (type: PostType) => boolean }[] = [
  { value: null, label: "Todos", match: () => true },
  { value: "feed", label: "Feed", match: (type) => type === "feed" || type === "carousel" },
  { value: "reels", label: "Reels", match: (type) => type === "reels" },
  { value: "stories", label: "Stories", match: (type) => type === "stories" },
];

// Current URL with some query params changed (null removes one). Event handlers only.
function urlWith(changes: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}

// Updates the query through the history API (Next syncs useSearchParams, no server round trip).
// Entries pushed for the dialog are flagged, so closing it can step back instead of stacking entries.
function setQuery(mode: "push" | "replace", changes: Record<string, string | null>) {
  if (mode === "push") window.history.pushState({ aqDialog: true }, "", urlWith(changes));
  else window.history.replaceState({ aqDialog: window.history.state?.aqDialog }, "", urlWith(changes));
}

// "3 para aprovar · 2 aprovados · 1 com ajuste solicitado"
function summary(posts: ClientPost[]) {
  const count = (status: Enums<"post_status">) => posts.filter((post) => post.status === status).length;
  const pending = count("pending");
  const approved = count("approved");
  const changes = count("changes_requested");
  const parts = [
    pending ? `${pending} para aprovar` : "Nada pendente",
    approved && `${approved} ${approved === 1 ? "aprovado" : "aprovados"}`,
    changes && `${changes} com ajuste solicitado`,
  ];
  return parts.filter(Boolean).join(" · ");
}

// Month picker, type tabs, card grid and the post dialog.
// Tabs, the open post and its "request changes" mode live in the URL, so they switch instantly
// and survive refreshes and remounts.
export function ClientBoard({
  posts,
  months,
  month,
  handle,
}: {
  posts: ClientPost[];
  months: MonthOption[];
  month: string;
  handle: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [monthPending, startMonth] = useTransition();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const tab = tabs.find((item) => item.value === searchParams.get("tipo")) ?? tabs[0];
  const openPost = posts.find((post) => post.id === searchParams.get("conteudo")) ?? null;
  const visible = posts.filter((post) => tab.match(post.type));

  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const hideToast = useCallback(() => setToast(null), []);

  // Drop a stale toast when Activity hides this page.
  useLayoutEffect(() => () => setToast(null), []);

  // Pin the month the server picked, so a refresh after a decision stays on it.
  useEffect(() => {
    if (!searchParams.get("mes")) setQuery("replace", { mes: month });
  }, [month, searchParams]);

  const open = (postId: string, adjust = false) => setQuery("push", { conteudo: postId, ajuste: adjust ? "1" : null });
  const setAdjusting = useCallback((on: boolean) => setQuery("replace", { ajuste: on ? "1" : null }), []);

  // Opened from the grid: go back (matches the phone's back gesture). Opened from a link: drop the params.
  const close = useCallback(() => {
    if (window.history.state?.aqDialog) window.history.back();
    else setQuery("replace", { conteudo: null, ajuste: null });
  }, []);

  const decided = useCallback(
    (message: string) => {
      close();
      notify(message);
    },
    [close, notify],
  );

  async function quickApprove(post: ClientPost) {
    if (!window.confirm(`Aprovar "${post.title}"?`)) return;
    setBusyId(post.id);
    try {
      const result = await decidePost(post.id, "approved");
      notify(result.ok ? "Conteúdo aprovado." : result.error);
    } catch {
      notify("Algo deu errado. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row-reverse md:items-center md:justify-between">
        <label className="relative block md:w-80">
          <CalendarDays size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand" />
          <select
            aria-label="Mês"
            value={month}
            onChange={(event) =>
              startMonth(() => router.push(urlWith({ mes: event.target.value, conteudo: null }), { scroll: false }))
            }
            className={`${inputClass} pl-10 ${monthPending ? "opacity-60" : ""}`}
          >
            {months.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* One scrollable row on phones instead of wrapping into several lines. */}
        <nav aria-label="Tipo de conteúdo" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          {tabs.map((item) => {
            const active = item === tab;
            const count = posts.filter((post) => item.match(post.type)).length;
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={active}
                onClick={() => setQuery("replace", { tipo: item.value })}
                className={`flex min-h-11 shrink-0 items-center rounded-xl px-4 md:px-6 ${
                  active ? "bg-brand-dark text-white" : "bg-[#eee9f6] text-[#655a7f] hover:bg-chip"
                }`}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </nav>
      </div>

      <p className={`-mt-1 text-[13px] text-muted ${monthPending ? "opacity-60" : ""}`}>{summary(posts)}</p>

      {visible.length === 0 ? (
        <EmptyState title="Nada por aqui">Nenhum conteúdo deste tipo neste mês.</EmptyState>
      ) : (
        <div
          className={`grid grid-cols-1 gap-3 min-[411px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 ${monthPending ? "opacity-60" : ""}`}
        >
          {visible.map((post) => (
            <ClientPostCard
              key={post.id}
              post={post}
              busy={busyId === post.id}
              onOpen={() => open(post.id)}
              onApprove={() => quickApprove(post)}
              onAdjust={() => open(post.id, true)}
            />
          ))}
        </div>
      )}

      {openPost && (
        <PostModal
          key={openPost.id}
          post={openPost}
          handle={handle}
          adjusting={searchParams.get("ajuste") === "1"}
          onAdjustingChange={setAdjusting}
          onClose={close}
          onDecided={decided}
        />
      )}
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
