import { Suspense } from "react";
import { addTeamMember } from "@/app/agencia/access-actions";
import { AccessList } from "@/components/access/access-list";
import { AddAccessForm } from "@/components/access/add-access-form";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { cardClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default function TeamPage() {
  return (
    <>
      <PageHeader eyebrow="Equipe" title="Equipe da agência" subtitle="Quem cria e envia conteúdos para os clientes." />
      <FreshOnNavigate>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className={`${cardClass} p-5`}>
            <Suspense fallback={<ListSkeleton rows={2} />}>
              <TeamList />
            </Suspense>
          </section>
          <section className={`${cardClass} grid gap-3 p-5`}>
            <h2 className="text-base font-bold">Adicionar pessoa</h2>
            <AddAccessForm action={addTeamMember} nameRequired submitLabel="Adicionar à equipe" />
          </section>
        </div>
      </FreshOnNavigate>
    </>
  );
}

async function TeamList() {
  const me = await requireRole("agency");
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "agency")
    .order("created_at");
  return <AccessList accesses={team ?? []} currentUserId={me.id} />;
}
