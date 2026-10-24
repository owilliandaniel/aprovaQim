"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui";
import { contentHref, type ContentFilters } from "./filters";

// Client and month pickers (side by side on phones); changing one updates the URL.
export function FilterBar({ clients, filters }: { clients: { id: string; name: string; active: boolean }[]; filters: ContentFilters }) {
  const router = useRouter();
  const update = (next: Partial<ContentFilters>) => router.push(contentHref({ ...filters, ...next }));

  return (
    <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <select
        aria-label="Cliente"
        value={filters.client ?? ""}
        onChange={(event) => update({ client: event.target.value || null })}
        className={`${inputClass} min-w-0 sm:w-auto sm:min-w-56`}
      >
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.active ? client.name : `${client.name} (inativo)`}
          </option>
        ))}
      </select>
      <input
        type="month"
        aria-label="Mês"
        value={filters.month ?? ""}
        onChange={(event) => update({ month: event.target.value || null })}
        className={`${inputClass} min-w-0 sm:w-auto`}
      />
      {filters.month && (
        <button
          type="button"
          onClick={() => update({ month: null })}
          className="col-span-2 min-h-11 justify-self-start px-1 text-[13px] font-semibold text-brand sm:min-h-0"
        >
          Todos os meses
        </button>
      )}
    </div>
  );
}
