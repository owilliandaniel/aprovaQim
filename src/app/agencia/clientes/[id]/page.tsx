import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addClientAccess } from "@/app/agencia/access-actions";
import { AccessList } from "@/components/access/access-list";
import { AddAccessForm } from "@/components/access/add-access-form";
import { BackLink } from "@/components/back-link";
import { InactiveBadge } from "@/components/client-status-badge";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { buttonSecondary, cardClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { deleteClient, setClientActive, updateClient } from "../actions";
import { ClientStatusForm, DeleteClientForm, EditClientForm } from "./client-forms";

export default function ClientDetailPage({ params }: PageProps<"/agencia/clientes/[id]">) {
  return (
    <>
      <BackLink href="/agencia/clientes">Voltar para clientes</BackLink>
      <Suspense fallback={<ListSkeleton />}>{params.then(({ id }) => <ClientDetail id={id} />)}</Suspense>
    </>
  );
}

async function ClientDetail({ id }: { id: string }) {
  await requireRole("agency");
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: client }, { data: accesses }] = await Promise.all([
    supabase.from("clients").select("id, name, instagram_handle, active").eq("id", id).maybeSingle(),
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
      {!client.active && (
        <p className="mb-4 rounded-lg bg-warn-bg px-3 py-2 text-warn">
          Cliente inativo: ninguém da empresa consegue entrar até você reativar.
        </p>
      )}
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
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-brand sm:min-h-0">Adicionar acesso</summary>
            <div className="mt-3">
              <AddAccessForm action={addClientAccess.bind(null, client.id)} />
            </div>
          </details>
        </section>
      </div>

      <section className={`${cardClass} mt-4 p-5`}>
        <h2 className="flex items-center gap-2 text-base font-bold">
          Acesso da empresa {!client.active && <InactiveBadge />}
        </h2>
        <p className="mt-1 mb-3 text-[13px] text-muted">
          {client.active
            ? "Ativo: as pessoas da empresa podem entrar e aprovar. Inativar bloqueia o login sem apagar nada."
            : "Inativo: o login está bloqueado. Os conteúdos e acessos continuam guardados."}
        </p>
        <ClientStatusForm action={setClientActive.bind(null, client.id, !client.active)} name={client.name} active={client.active} />
      </section>

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
