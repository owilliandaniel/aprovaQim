"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Play } from "lucide-react";
import type { Enums } from "@/lib/supabase/database.types";

export type ThumbMedia = { kind: "image" | "video_link"; url: string } | null;

// Preview of a post's first media in Instagram's sizes: the card frame is always 4:5 (feed, 1080 × 1350),
// and reels/stories sit in a centered 9:16 frame (1080 × 1920). Video links get a play badge.
// A thumbnail that fails to load (e.g. a Drive file that isn't shared) falls back to the gradient.
export function MediaThumb({ media, type, className = "" }: { media: ThumbMedia; type: Enums<"post_type">; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = media && media.url !== failedUrl;
  const vertical = type === "reels" || type === "stories";

  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-[9px] bg-gradient-to-br from-[#23132e] via-[#745091] to-[#d4b5d0] ${className}`}
    >
      <div className={vertical ? "relative mx-auto aspect-[9/16] h-full bg-black/25 shadow-[0_0_18px_#0000004d]" : "absolute inset-0"}>
        {showImage ? (
          <Image
            src={media.url}
            alt=""
            fill
            unoptimized
            sizes="400px"
            onError={() => setFailedUrl(media.url)}
            className="object-cover"
          />
        ) : (
          !media && (
            <div className="grid h-full place-items-center text-white/70">
              <ImageIcon size={28} strokeWidth={1.5} />
            </div>
          )
        )}
        {media?.kind === "video_link" && (
          <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#130b1dba] text-white">
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </span>
        )}
      </div>
    </div>
  );
}
