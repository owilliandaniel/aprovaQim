"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui";
import { contentHref, type ContentFilters } from "./filters";

// Client and month pickers; changing one updates the URL.
export function FilterBar({ clients, filters }: { clients: { id: string; name: string }[]; filters: ContentFilters }) {
  const router = useRouter();
  const update = (next: Partial<ContentFilters>) => router.push(contentHref({ ...filters, ...next }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Cliente"
        value={filters.client ?? ""}
        onChange={(event) => update({ client: event.target.value || null })}
        className={`${inputClass} sm:w-auto sm:min-w-56`}
      >
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <input
        type="month"
        aria-label="Mês"
        value={filters.month ?? ""}
        onChange={(event) => update({ month: event.target.value || null })}
        className={`${inputClass} sm:w-auto`}
      />
      {filters.month && (
        <button type="button" onClick={() => update({ month: null })} className="text-[13px] font-semibold text-brand">
          Todos os meses
        </button>
      )}
    </div>
  );
}
