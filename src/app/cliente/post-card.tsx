"use client";

import { CheckCircle2, PencilLine } from "lucide-react";
import { TypeBadge } from "@/components/badges";
import { MediaThumb, type ThumbMedia } from "@/components/media-thumb";
import { formatDate } from "@/lib/format";
import { driveThumbnailUrl } from "@/lib/media";
import type { ClientPost } from "./types";

const actionClass =
  "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[11px] px-2 text-[13px] font-semibold whitespace-nowrap transition disabled:opacity-60";

// Client card: tapping it opens the preview; pending posts get Aprovar / Ajuste.
export function ClientPostCard({
  post,
  busy,
  onOpen,
  onApprove,
  onAdjust,
}: {
  post: ClientPost;
  busy: boolean;
  onOpen: () => void;
  onApprove: () => void;
  onAdjust: () => void;
}) {
  const first = post.media[0];
  const thumb: ThumbMedia = !first
    ? null
    : first.kind === "image"
      ? { kind: "image", url: first.url }
      : { kind: "video_link", url: driveThumbnailUrl(first.driveId) };

  return (
    <article
      onClick={onOpen}
      className="flex cursor-pointer flex-col rounded-[13px] border border-[#e9e3f1] bg-[#fbfaff] p-3 shadow-[0_2px_7px_#2b134c05] transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_#2b134c12]"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <TypeBadge type={post.type} />
        {post.media.length > 1 && <span className="text-xs text-muted">{post.media.length} mídias</span>}
      </div>
      <div className="mb-2 text-xs text-[#796b9b]">{formatDate(post.plannedDate)}</div>
      {/* The click bubbles up to the card; the button makes it reachable by keyboard. */}
      <button type="button" aria-label={`Ver ${post.title}`} className="block w-full rounded-[9px]">
        <MediaThumb media={thumb} type={post.type} />
      </button>
      <h2 className="mt-2.5 line-clamp-1 font-semibold">{post.title}</h2>
      {post.caption && <p className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-[#1f1630]">{post.caption}</p>}

      <div className="mt-auto pt-3" onClick={(event) => event.stopPropagation()}>
        {post.status === "pending" ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onApprove} disabled={busy} className={`${actionClass} bg-ok-bg text-[#145e50] hover:bg-[#d3ece4]`}>
              <CheckCircle2 size={16} /> {busy ? "Aprovando..." : "Aprovar"}
            </button>
            <button type="button" onClick={onAdjust} disabled={busy} className={`${actionClass} bg-[#eee8f7] text-[#492080] hover:bg-chip`}>
              <PencilLine size={16} /> Ajuste
            </button>
          </div>
        ) : post.status === "approved" ? (
          <button type="button" onClick={onOpen} className={`${actionClass} bg-ok-bg text-ok`}>
            <CheckCircle2 size={16} /> Aprovado
          </button>
        ) : (
          <button type="button" onClick={onOpen} className={`${actionClass} bg-danger-bg text-danger`}>
            <PencilLine size={16} /> Ajuste solicitado
          </button>
        )}
      </div>
    </article>
  );
}
