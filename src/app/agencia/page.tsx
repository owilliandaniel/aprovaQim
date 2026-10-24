import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InactiveBadge } from "@/components/client-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusCountChips } from "@/components/status-counts";
import { buttonPrimary, buttonSecondary, buttonSmall, cardClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { countByClient } from "@/lib/post-stats";
import { createClient } from "@/lib/supabase/server";

export default function AgencyDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Painel"
        title="Visão geral"
        subtitle="Acompanhe as aprovações dos seus clientes."
        action={
          <Link href="/agencia/conteudos/novo" className={buttonPrimary}>
            <Plus size={18} /> Novo conteúdo
          </Link>
        }
      />
      <Suspense fallback={<StatCardsSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

// Totals by status plus one row per client.
async function Overview() {
  await requireRole("agency");
  const supabase = await createClient();
  const [{ data: clients }, { data: posts }] = await Promise.all([
    supabase.from("clients").select("id, name, active").order("name"),
    supabase.from("posts").select("client_id, status"),
  ]);

  const countBy = (status: string) => posts?.filter((post) => post.status === status).length ?? 0;
  const stats = [
    { label: "Clientes", value: clients?.length ?? 0, href: "/agencia/clientes" },
    { label: "Aguardando aprovação", value: countBy("pending"), href: "/agencia/conteudos?status=pending" },
    { label: "Ajustes solicitados", value: countBy("changes_requested"), href: "/agencia/conteudos?status=changes_requested" },
    { label: "Aprovados", value: countBy("approved"), href: "/agencia/conteudos?status=approved" },
  ];
  const counts = countByClient(posts ?? []);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className={`${cardClass} p-5 transition hover:border-[#b88ce8]`}>
            <div className="text-muted">{stat.label}</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight">{stat.value}</div>
          </Link>
        ))}
      </div>

      {!clients?.length ? (
        <EmptyState title="Nenhum cliente cadastrado">
          <Link href="/agencia/clientes/novo" className="font-semibold text-brand underline">
            Cadastre o primeiro cliente
          </Link>{" "}
          para começar a enviar conteúdos para aprovação.
        </EmptyState>
      ) : (
        <section className={`${cardClass} p-2`}>
          <h2 className="px-3 pt-3 pb-2 font-bold">Por cliente</h2>
          <ul className="divide-y divide-line">
            {clients.map((client) => (
              <li key={client.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                <span className="flex items-center gap-2 font-semibold">
                  {client.name}
                  {!client.active && <InactiveBadge />}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusCountChips counts={counts.get(client.id)} />
                  <Link href={`/agencia/conteudos?cliente=${client.id}`} className={`${buttonSecondary} ${buttonSmall}`}>
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-line bg-white" />
      ))}
    </div>
  );
}
