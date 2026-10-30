"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MoreHorizontal, Play, Send } from "lucide-react";
import { drivePreviewUrl, driveThumbnailUrl } from "@/lib/media";
import type { Enums } from "@/lib/supabase/database.types";

export type PreviewMedia = { kind: "image"; url: string } | { kind: "video"; driveId: string };

type Variant = "feed" | "stories" | "reels";

// "Empresa Teste" -> "ET"
const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

// Instagram-like preview: feed card (single image or carousel), Stories or Reels frame.
export function PostPreview({ type, media, handle }: { type: Enums<"post_type">; media: PreviewMedia[]; handle: string }) {
  if (type === "reels" || type === "stories") {
    return <MediaSlider items={media} variant={type} handle={handle} />;
  }
  return (
    <div className="mx-auto w-full max-w-[410px] rounded-[10px] bg-white px-3 pt-3 pb-2.5 shadow-[0_2px_10px_#351c5b08]">
      <div className="flex items-center gap-2.5 px-1 pb-2.5 text-[13px] font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white">
          {initials(handle)}
        </span>
        <span className="truncate">{handle}</span>
        <MoreHorizontal size={20} className="ml-auto shrink-0" aria-hidden />
      </div>
      <MediaSlider items={media} variant="feed" handle={handle} />
      <div className="flex items-center gap-3.5 px-1 pt-2.5 text-ink" aria-hidden>
        <Heart size={21} />
        <MessageCircle size={21} />
        <Send size={20} />
        <Bookmark size={20} className="ml-auto" />
      </div>
    </div>
  );
}

// Swipeable media (scroll snap) with arrows; dots under the feed, progress bars on Stories.
function MediaSlider({ items, variant, handle }: { items: PreviewMedia[]; variant: Variant; handle: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = items.length > 1;
  const tall = variant !== "feed";
  const current = items[index];

  function go(next: number) {
    const element = track.current;
    if (element) element.scrollTo({ left: next * element.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div
        className={
          tall
            ? "relative mx-auto aspect-[9/16] h-[min(60dvh,560px)] max-w-full overflow-hidden rounded-[10px] bg-[#120a1a] has-[iframe]:min-w-[min(320px,100%)] md:h-[min(64vh,620px)]"
            : "relative aspect-[4/5] overflow-hidden rounded-lg bg-[#f1ecf7]"
        }
      >
        <div
          ref={track}
          onScroll={(event) => {
            const element = event.currentTarget;
            setIndex(Math.round(element.scrollLeft / element.clientWidth));
          }}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${items.length}`}
              className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
            >
              {item.kind === "image" ? (
                <Image src={item.url} alt="" fill unoptimized sizes="(min-width: 768px) 420px, 100vw" className="object-contain" />
              ) : (
                <VideoSlide driveId={item.driveId} active={i === index} />
              )}
            </div>
          ))}
          {items.length === 0 && <p className="m-auto text-[13px] text-muted">Sem mídia</p>}
        </div>

        {variant === "stories" && (
          <div className="pointer-events-none absolute inset-x-2 top-2 grid gap-2">
            {many && (
              <div className="flex gap-1">
                {items.map((_, i) => (
                  <span key={i} className={`h-0.5 flex-1 rounded-full ${i <= index ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white drop-shadow">
              <span className="grid size-7 place-items-center rounded-full bg-brand text-[10px] font-extrabold">
                {initials(handle)}
              </span>
              {handle}
            </div>
          </div>
        )}

        {many && index > 0 && <Arrow side="left" onClick={() => go(index - 1)} />}
        {many && index < items.length - 1 && <Arrow side="right" onClick={() => go(index + 1)} />}
      </div>

      {variant === "feed" && many && (
        <div className="flex justify-center gap-1.5 pt-3" aria-hidden>
          {items.map((_, i) => (
            <span key={i} className={`h-[7px] rounded-full ${i === index ? "w-2.5 bg-[#6c2bc1]" : "w-[7px] bg-[#d8cce9]"}`} />
          ))}
        </div>
      )}
      {current?.kind === "video" && (
        <a
          href={`https://drive.google.com/file/d/${current.driveId}/view`}
          target="_blank"
          rel="noreferrer"
          className="mx-auto mt-2 flex min-h-11 w-fit items-center px-2 text-xs font-semibold text-brand underline sm:min-h-0"
        >
          O vídeo não abriu? Ver no Google Drive
        </a>
      )}
    </div>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Mídia anterior" : "Próxima mídia"}
      className={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-[#e5daf6] bg-white/95 text-[#56218c] shadow-[0_3px_12px_#28133d14] ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      <Icon size={22} />
    </button>
  );
}

// Drive thumbnail + play button; the Drive player only loads after a tap.
// The player's layout breaks under 320px, so it never gets less: tighter slots crop it evenly.
function VideoSlide({ driveId, active }: { driveId: string; active: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  if (playing && active) {
    return (
      <iframe
        src={drivePreviewUrl(driveId)}
        title="Vídeo do conteúdo"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-y-0 left-1/2 h-full w-full min-w-80 -translate-x-1/2 border-0 bg-black"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="Reproduzir vídeo"
      className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#23132e] via-[#745091] to-[#d4b5d0]"
    >
      {!thumbFailed && (
        <Image
          src={driveThumbnailUrl(driveId)}
          alt=""
          fill
          unoptimized
          sizes="420px"
          onError={() => setThumbFailed(true)}
          className="object-cover"
        />
      )}
      <span className="relative grid size-16 place-items-center rounded-full bg-[#12091cbd] text-white">
        <Play size={26} fill="currentColor" className="ml-1" />
      </span>
    </button>
  );
}
