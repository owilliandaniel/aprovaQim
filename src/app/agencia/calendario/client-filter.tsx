"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { inputClass } from "@/components/ui";

// Client picker for the calendar; keeps the month and day in the URL.
export function CalendarClientFilter({
  clients,
  value,
}: {
  clients: { id: string; name: string; active: boolean }[];
  value: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function change(client: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (client) params.set("cliente", client);
    else params.delete("cliente");
    startTransition(() => router.push(`/agencia/calendario?${params}`, { scroll: false }));
  }

  return (
    <select
      aria-label="Cliente"
      value={value ?? ""}
      onChange={(event) => change(event.target.value)}
      className={`${inputClass} sm:w-auto sm:min-w-56 ${pending ? "opacity-60" : ""}`}
    >
      <option value="">Todos os clientes</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.active ? client.name : `${client.name} (inativo)`}
        </option>
      ))}
    </select>
  );
}
