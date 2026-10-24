import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InactiveBadge } from "@/components/client-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { StatusCountChips } from "@/components/status-counts";
import { buttonPrimary, buttonSecondary, buttonSmall, cardClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { countByClient } from "@/lib/post-stats";
import { createClient } from "@/lib/supabase/server";

export default function AgencyClientsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        subtitle="Empresas atendidas e seus acessos."
        action={
          <Link href="/agencia/clientes/novo" className={buttonPrimary}>
            <Plus size={18} /> Novo cliente
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ClientList />
      </Suspense>
    </>
  );
}

async function ClientList() {
  await requireRole("agency");
  const supabase = await createClient();
  const [{ data: clients }, { data: accesses }, { data: posts }] = await Promise.all([
    supabase.from("clients").select("id, name, instagram_handle, active").order("name"),
    supabase.from("profiles").select("client_id, email").eq("role", "client"),
    supabase.from("posts").select("client_id, status"),
  ]);

  if (!clients?.length) {
    return (
      <EmptyState title="Nenhum cliente cadastrado">
        Cadastre o primeiro cliente e crie o login que ele vai usar para aprovar os conteúdos.
      </EmptyState>
    );
  }

  const counts = countByClient(posts ?? []);
  return (
    <ul className="grid gap-3">
      {clients.map((client) => {
        const emails = (accesses ?? []).filter((a) => a.client_id === client.id).map((a) => a.email);
        return (
          <li key={client.id} className={`${cardClass} grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8def7] text-base font-bold text-brand">
                {client.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold">
                  <span className="truncate">{client.name}</span>
                  {!client.active && <InactiveBadge />}
                </div>
                <div className="truncate text-[13px] text-muted">
                  {[client.instagram_handle, emails.join(", ") || "sem acesso"].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <StatusCountChips counts={counts.get(client.id)} />
              <Link href={`/agencia/conteudos?cliente=${client.id}`} className={`${buttonSecondary} ${buttonSmall}`}>
                Conteúdos
              </Link>
              <Link href={`/agencia/clientes/${client.id}`} className={`${buttonSecondary} ${buttonSmall}`}>
                Gerenciar
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
