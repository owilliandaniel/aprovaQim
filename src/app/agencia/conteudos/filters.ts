import { isYearMonth } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { Constants, type Enums } from "@/lib/supabase/database.types";

export type ContentFilters = { client: string | null; month: string | null; status: Enums<"post_status"> | null };

const isStatus = (value: unknown): value is Enums<"post_status"> =>
  Constants.public.Enums.post_status.includes(value as Enums<"post_status">);

// Reads ?cliente=&mes=&status= and drops anything invalid.
export function parseContentFilters(params: Record<string, string | string[] | undefined>): ContentFilters {
  const one = (key: string) => (typeof params[key] === "string" ? params[key] : null);
  const client = one("cliente");
  const month = one("mes");
  const status = one("status");
  return {
    client: isUuid(client) ? client : null,
    month: isYearMonth(month) ? month : null,
    status: isStatus(status) ? status : null,
  };
}

// Builds the list URL from filters (empty values are dropped).
export function contentHref(filters: ContentFilters) {
  const params = new URLSearchParams();
  if (filters.client) params.set("cliente", filters.client);
  if (filters.month) params.set("mes", filters.month);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return query ? `/agencia/conteudos?${query}` : "/agencia/conteudos";
}
