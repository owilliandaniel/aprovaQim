import type { Enums } from "@/lib/supabase/database.types";

// UI labels in pt-BR for database enums.
export const postTypeLabel: Record<Enums<"post_type">, string> = {
  feed: "Feed",
  carousel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
};

export const postStatusLabel: Record<Enums<"post_status">, string> = {
  draft: "Rascunho",
  pending: "Aguardando aprovação",
  approved: "Aprovado",
  changes_requested: "Ajuste solicitado",
};
