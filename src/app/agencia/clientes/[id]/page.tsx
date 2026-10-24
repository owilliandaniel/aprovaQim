import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { addClientAccess } from "@/app/agencia/access-actions";
import { AccessList } from "@/components/access/access-list";
import { AddAccessForm } from "@/components/access/add-access-form";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { buttonSecondary, cardClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { deleteClient, updateClient } from "../actions";
import { DeleteClientForm, EditClientForm } from "./client-forms";

export default function ClientDetailPage({ params }: PageProps<"/agencia/clientes/[id]">) {
  return (
    <>
      <Link href="/agencia/clientes" className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#4b2580]">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>
      <Suspense fallback={<ListSkeleton />}>{params.then(({ id }) => <ClientDetail id={id} />)}</Suspense>
    </>
  );
}

async function ClientDetail({ id }: { id: string }) {
  await requireRole("agency");
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: client }, { data: accesses }] = await Promise.all([
    supabase.from("clients").select("id, name, instagram_handle").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id, email, full_name").eq("client_id", id).order("created_at"),
  ]);
  if (!client) notFound();

  return (
    <FreshOnNavigate>
      <PageHeader
        eyebrow="Cliente"
        title={client.name}
        subtitle={client.instagram_handle ?? undefined}
        action={
          <Link href={`/agencia/conteudos?cliente=${client.id}`} className={buttonSecondary}>
            Ver conteúdos
          </Link>
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className={`${cardClass} grid gap-4 p-5`}>
          <h2 className="text-base font-bold">Dados da empresa</h2>
          <EditClientForm
            action={updateClient.bind(null, client.id)}
            name={client.name}
            instagram={client.instagram_handle ?? ""}
          />
        </section>

        <section className={`${cardClass} grid gap-4 p-5`}>
          <div>
            <h2 className="text-base font-bold">Acessos</h2>
            <p className="text-[13px] text-muted">Pessoas da empresa que podem aprovar os conteúdos.</p>
          </div>
          <AccessList accesses={accesses ?? []} />
          <details className="rounded-xl border border-line p-3">
            <summary className="cursor-pointer font-semibold text-brand">Adicionar acesso</summary>
            <div className="mt-3">
              <AddAccessForm action={addClientAccess.bind(null, client.id)} />
            </div>
          </details>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-danger/25 bg-white p-5">
        <h2 className="text-base font-bold text-danger">Excluir cliente</h2>
        <p className="mt-1 mb-3 text-[13px] text-muted">
          Remove a empresa, todos os conteúdos, comentários e os acessos dela. Não dá para desfazer.
        </p>
        <DeleteClientForm action={deleteClient.bind(null, client.id)} name={client.name} />
      </section>
    </FreshOnNavigate>
  );
}
