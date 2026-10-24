import type { Enums } from "@/lib/supabase/database.types";

export const MEDIA_BUCKET = "post-media";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_CAROUSEL_ITEMS = 10;

// Extracts the file id from Google Drive share links (/file/d/ID/... or ?id=ID).
export function driveFileId(url: string) {
  try {
    const parsed = new URL(url.trim());
    if (!/(^|\.)drive\.google\.com$/.test(parsed.hostname)) return null;
    const fromPath = parsed.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1];
    const fromQuery = parsed.searchParams.get("id");
    return fromPath ?? (fromQuery && /^[\w-]{10,}$/.test(fromQuery) ? fromQuery : null);
  } catch {
    return null;
  }
}

export function drivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Works only when the file is shared as "anyone with the link".
export function driveThumbnailUrl(fileId: string) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`;
}

type MediaKind = Enums<"media_kind">;

// Checks the media a post needs before it can be sent for approval; null when fine.
export function mediaRuleError(type: Enums<"post_type">, kinds: MediaKind[]) {
  const videos = kinds.filter((kind) => kind === "video_link").length;
  if (kinds.length === 0) return "Adicione pelo menos uma imagem ou vídeo.";
  switch (type) {
    case "feed":
      return kinds.length > 1 ? "Feed tem só uma mídia. Para várias, use Carrossel." : null;
    case "carousel":
      if (kinds.length < 2) return "Carrossel precisa de pelo menos 2 mídias.";
      return kinds.length > MAX_CAROUSEL_ITEMS ? `Carrossel aceita até ${MAX_CAROUSEL_ITEMS} mídias.` : null;
    case "reels":
      return videos === 1 && kinds.length === 1 ? null : "Reels precisa de exatamente um vídeo (link do Google Drive).";
    case "stories":
      return null;
  }
}
