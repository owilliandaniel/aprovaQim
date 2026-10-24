import Image from "next/image";
import { ImageIcon, Play } from "lucide-react";

export type ThumbMedia = { kind: "image" | "video_link"; url: string } | null;

// Square-ish preview of a post's first media; video links get a play badge.
export function MediaThumb({ media, className = "" }: { media: ThumbMedia; className?: string }) {
  return (
    <div
      className={`relative aspect-[1/0.68] w-full overflow-hidden min-[411px]:aspect-[1/0.88] rounded-[9px] bg-gradient-to-br from-[#23132e] via-[#745091] to-[#d4b5d0] ${className}`}
    >
      {media ? (
        <Image src={media.url} alt="" fill unoptimized sizes="400px" className="object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-white/70">
          <ImageIcon size={28} strokeWidth={1.5} />
        </div>
      )}
      {media?.kind === "video_link" && (
        <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#130b1dba] text-white">
          <Play size={20} fill="currentColor" className="ml-0.5" />
        </span>
      )}
    </div>
  );
}
