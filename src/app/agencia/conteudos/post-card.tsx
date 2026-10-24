import Link from "next/link";
import { Pencil, Send, Trash2 } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { ConfirmButton } from "@/components/confirm-button";
import { MediaThumb, type ThumbMedia } from "@/components/media-thumb";
import { SubmitButton } from "@/components/submit-button";
import { buttonDanger, buttonPrimary, buttonSecondary, buttonSmall } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Enums } from "@/lib/supabase/database.types";
import { deletePostAction, sendPostAction } from "./actions";

export type AgencyPost = {
  id: string;
  type: Enums<"post_type">;
  status: Enums<"post_status">;
  title: string;
  plannedDate: string;
  clientName: string | null;
  thumb: ThumbMedia;
  changeRequest: string | null;
  blockedReason: string | null;
};

// Agency view of a post: status, latest change request and quick actions.
export function PostCard({ post }: { post: AgencyPost }) {
  const canSend = post.status === "draft" || post.status === "changes_requested";
  return (
    <article className="flex flex-col rounded-[13px] border border-[#e9e3f1] bg-[#fbfaff] p-3 shadow-[0_2px_7px_#2b134c05]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <TypeBadge type={post.type} />
        <StatusBadge status={post.status} />
      </div>
      <div className="mb-2 truncate text-xs text-[#796b9b]">
        {formatDate(post.plannedDate)}
        {post.clientName && ` · ${post.clientName}`}
      </div>
      <Link href={`/agencia/conteudos/${post.id}`} aria-label={`Editar ${post.title}`}>
        <MediaThumb media={post.thumb} />
      </Link>
      <h2 className="mt-2.5 line-clamp-2 font-semibold">{post.title}</h2>

      {post.changeRequest && post.status === "changes_requested" && (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-[13px] text-danger">“{post.changeRequest}”</p>
      )}
      {canSend && post.blockedReason && <p className="mt-2 text-[12px] text-warn">{post.blockedReason}</p>}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <Link href={`/agencia/conteudos/${post.id}`} className={`${buttonSecondary} ${buttonSmall} flex-1`}>
          <Pencil size={14} /> Editar
        </Link>
        {canSend && (
          <form action={sendPostAction.bind(null, post.id)} className="flex flex-1">
            <SubmitButton
              className={`${buttonPrimary} ${buttonSmall} flex-1`}
              pendingLabel="Enviando..."
              disabled={Boolean(post.blockedReason)}
            >
              <Send size={14} /> {post.status === "changes_requested" ? "Reenviar" : "Enviar"}
            </SubmitButton>
          </form>
        )}
        <form action={deletePostAction.bind(null, post.id)}>
          <ConfirmButton
            message={`Excluir "${post.title}"? Não dá para desfazer.`}
            className={`${buttonDanger} ${buttonSmall}`}
            pendingLabel="..."
          >
            <Trash2 size={14} />
            <span className="sr-only">Excluir</span>
          </ConfirmButton>
        </form>
      </div>
    </article>
  );
}
