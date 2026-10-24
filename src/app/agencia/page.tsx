import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default function AgencyDashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Painel" title="Visão geral" subtitle="Acompanhe as aprovações dos seus clientes." />
      <Suspense fallback={<StatCardsSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

// Totals of clients and posts by status, across all clients.
async function Overview() {
  await requireRole("agency");
  const supabase = await createClient();
  const [{ count: clientCount }, { data: posts }] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("status"),
  ]);

  const countBy = (status: string) => posts?.filter((post) => post.status === status).length ?? 0;
  const stats = [
    { label: "Clientes", value: clientCount ?? 0 },
    { label: "Aguardando aprovação", value: countBy("pending") },
    { label: "Ajustes solicitados", value: countBy("changes_requested") },
    { label: "Aprovados", value: countBy("approved") },
  ];

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-5">
            <div className="text-muted">{stat.label}</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>
      {!clientCount && (
        <EmptyState title="Nenhum cliente cadastrado">
          Cadastre o primeiro cliente para começar a enviar conteúdos para aprovação.
        </EmptyState>
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
