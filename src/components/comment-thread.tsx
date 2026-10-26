"use client";

import { useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { inputClass } from "@/components/ui";
import { addComment } from "@/lib/comment-actions";
import { MAX_COMMENT, type ThreadComment } from "@/lib/comments";

const countLabel = (n: number) => (n === 0 ? "Nenhum comentário ainda" : n === 1 ? "1 comentário" : `${n} comentários`);

// Conversation about a post (oldest first) with a box to reply; change requests stand out.
export function CommentThread({ postId, comments }: { postId: string; comments: ThreadComment[] }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!text.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await addComment(postId, text);
        if (result.ok) setText("");
        else setError(result.error);
      } catch {
        setError("Não foi possível enviar o comentário.");
      }
    });
  }

  return (
    <section aria-label="Comentários">
      <h3 className="text-base font-bold">Comentários</h3>
      <p className="text-xs text-[#897ca0]">{countLabel(comments.length)}</p>

      {comments.length > 0 && (
        <ol className="mt-3 grid gap-2.5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <span
                aria-hidden
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  comment.fromAgency ? "bg-brand text-white" : "bg-[#eee3fb] text-[#6329a0]"
                }`}
              >
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
              <div
                className={`min-w-0 flex-1 rounded-lg px-3 py-2 ${
                  comment.isChangeRequest ? "bg-danger-bg text-danger" : "bg-[#f7f4fc]"
                }`}
              >
                <div className="text-xs font-semibold">
                  {comment.authorName}
                  {comment.fromAgency && !comment.mine && <span className="font-normal text-muted"> · Agência</span>}
                  {comment.isChangeRequest && " · Pedido de ajuste"}
                  <span className="font-normal text-muted"> · {comment.when}</span>
                </div>
                <p className="mt-0.5 text-[13px] break-words whitespace-pre-line">{comment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        className="mt-3 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <div className="relative">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                send();
              }
            }}
            maxLength={MAX_COMMENT}
            rows={2}
            placeholder="Deixe um comentário..."
            aria-label="Novo comentário"
            className={`${inputClass} min-h-[76px] resize-y pr-12`}
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            aria-label="Enviar comentário"
            className="absolute top-1 right-1 grid size-11 place-items-center rounded-lg text-brand hover:bg-pale disabled:text-[#b9afc9]"
          >
            <SendHorizontal size={19} />
          </button>
        </div>
        {pending && <p className="text-xs text-muted">Enviando...</p>}
        <FormMessage error={error} />
      </form>
    </section>
  );
}
