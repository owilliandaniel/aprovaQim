"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, PencilLine, X } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { CommentThread } from "@/components/comment-thread";
import { CopyButton } from "@/components/copy-button";
import { FormMessage } from "@/components/form-message";
import { PostPreview } from "@/components/post-preview";
import { buttonGhost, buttonPrimary, buttonSecondary, inputClass, labelTextClass } from "@/components/ui";
import { MAX_COMMENT } from "@/lib/comments";
import { formatDateLong } from "@/lib/format";
import { decidePost, type Decision } from "./actions";
import type { ClientPost } from "./types";

type Props = {
  post: ClientPost;
  // Instagram handle (or company name) shown in the preview.
  handle: string;
  adjusting: boolean;
  onAdjustingChange: (on: boolean) => void;
  onClose: () => void;
  onDecided: (message: string) => void;
};

// Post preview + details: caption, comments and the approve / request-changes decision.
// Phones get a full-screen sheet; larger screens a two-column dialog like the reference.
export function PostModal({ post, handle, adjusting, onAdjustingChange, onClose, onDecided }: Props) {
  const dialog = useRef<HTMLElement>(null);

  // Lock page scroll while open; Activity runs the cleanup when the page gets hidden.
  useLayoutEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Escape closes; focus goes into the dialog and back to where it was.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-[#1e162f]/35 backdrop-blur-[2px] md:items-center md:p-[18px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-title"
        className="relative flex h-dvh w-full flex-col bg-white outline-none md:grid md:h-[min(780px,calc(100dvh-36px))] md:max-w-[1050px] md:grid-cols-[54%_46%] md:grid-rows-[minmax(0,1fr)_auto] md:overflow-hidden md:rounded-xl md:shadow-[0_22px_80px_#170d2a30]"
      >
        <div className="flex shrink-0 items-center border-b border-line px-1 pt-[env(safe-area-inset-top)] md:hidden">
          <button type="button" onClick={onClose} className="flex min-h-12 items-center gap-2 px-3 font-semibold text-[#4b2580]">
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>

        {/* One scroll area on phones; on larger screens each column scrolls on its own. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:contents">
          <div className="bg-[#f7f4fc] px-3 py-4 md:row-span-2 md:overflow-y-auto md:px-6 md:py-5">
            <button
              type="button"
              onClick={onClose}
              className="mb-4 hidden items-center gap-2.5 text-[13px] font-semibold text-[#4b2580] md:flex"
            >
              <ArrowLeft size={16} /> Voltar para os conteúdos
            </button>
            <PostPreview key={post.id} type={post.type} media={post.media} handle={handle} />
          </div>

          <div className="px-4 py-5 md:overflow-y-auto md:px-6 md:pt-6 md:pb-4">
            <div className="flex flex-wrap items-center gap-2 pr-10 text-xs text-[#83769d]">
              <TypeBadge type={post.type} />
              <span>{formatDateLong(post.plannedDate)}</span>
              {post.status !== "pending" && <StatusBadge status={post.status} />}
            </div>
            <h2 id="post-modal-title" className="mt-4 mb-3 text-xl font-bold tracking-[-0.6px]">
              {post.title}
            </h2>

            <div className="rounded-[10px] bg-[#f6f2fb] p-3.5 text-[13px] leading-relaxed text-[#514365]">
              <div className="mb-1 flex min-h-8 items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#26163d]">Legenda</span>
                {post.caption && <CopyButton text={post.caption} label="Copiar legenda" />}
              </div>
              <p className="break-words whitespace-pre-line">{post.caption || "Sem legenda."}</p>
            </div>

            <div className="mt-5 border-t border-[#eee7f5] pt-5">
              <CommentThread postId={post.id} comments={post.comments} />
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-line bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:col-start-2 md:px-6 md:pb-5">
          <DecisionBar post={post} adjusting={adjusting} onAdjustingChange={onAdjustingChange} onDecided={onDecided} />
        </footer>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 hidden size-11 place-items-center rounded-lg text-[#28143f] hover:bg-pale md:grid"
        >
          <X size={22} />
        </button>
      </section>
    </div>
  );
}

// Pending: Solicitar ajuste / Aprovar (the change request needs a note). Otherwise: the outcome.
function DecisionBar({
  post,
  adjusting,
  onAdjustingChange,
  onDecided,
}: Pick<Props, "post" | "adjusting" | "onAdjustingChange" | "onDecided">) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (post.status === "approved") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-ok-bg px-3 py-2.5 text-ok">
        <CheckCircle2 size={18} className="shrink-0" /> Aprovado{post.decidedLabel && ` em ${post.decidedLabel}`}.
      </p>
    );
  }
  if (post.status === "changes_requested") {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-danger">
        <PencilLine size={18} className="mt-px shrink-0" />
        <span>
          Ajuste solicitado{post.decidedLabel && ` em ${post.decidedLabel}`}. A agência vai enviar uma nova versão.
        </span>
      </p>
    );
  }

  function decide(decision: Decision) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await decidePost(post.id, decision, note);
        if (!result.ok) return setError(result.error);
        onDecided(decision === "approved" ? "Conteúdo aprovado." : "Pedido de ajuste enviado para a agência.");
      } catch {
        setError("Algo deu errado. Tente novamente.");
      }
    });
  }

  if (adjusting) {
    return (
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          decide("changes_requested");
        }}
      >
        <label className="grid gap-1.5">
          <span className={labelTextClass}>O que precisa ser ajustado?</span>
          <textarea
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={MAX_COMMENT}
            rows={3}
            placeholder="Ex.: trocar a foto da capa e corrigir o horário na legenda."
            className={`${inputClass} resize-y`}
          />
        </label>
        <FormMessage error={error} />
        <div className="flex gap-2">
          <button type="button" onClick={() => onAdjustingChange(false)} disabled={pending} className={buttonGhost}>
            Cancelar
          </button>
          <button type="submit" disabled={pending || !note.trim()} className={`${buttonPrimary} flex-1`}>
            {pending ? "Enviando..." : "Enviar pedido de ajuste"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-2">
      <FormMessage error={error} />
      <div className="flex gap-2">
        <button type="button" onClick={() => onAdjustingChange(true)} disabled={pending} className={`${buttonSecondary} flex-1`}>
          <PencilLine size={16} /> Solicitar ajuste
        </button>
        <button type="button" onClick={() => decide("approved")} disabled={pending} className={`${buttonPrimary} flex-1`}>
          <CheckCircle2 size={16} /> {pending ? "Aprovando..." : "Aprovar"}
        </button>
      </div>
    </div>
  );
}
