import { Suspense } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "../post-editor";

export default function NewContentPage({ searchParams }: PageProps<"/agencia/conteudos/novo">) {
  return (
    <>
      <BackLink href="/agencia/conteudos">Voltar para os conteúdos</BackLink>
      <PageHeader eyebrow="Conteúdos" title="Novo conteúdo" subtitle="Monte o post e envie para o cliente aprovar." />
      <Suspense fallback={<ListSkeleton rows={3} />}>
        {searchParams.then(({ cliente }) => (
          <NewContentEditor defaultClientId={isUuid(cliente) ? cliente : undefined} />
        ))}
      </Suspense>
    </>
  );
}

async function NewContentEditor({ defaultClientId }: { defaultClientId?: string }) {
  await requireRole("agency");
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");

  if (!clients?.length) {
    return (
      <EmptyState title="Cadastre um cliente primeiro">
        <Link href="/agencia/clientes/novo" className="font-semibold text-brand underline">
          Cadastrar cliente
        </Link>
      </EmptyState>
    );
  }
  return (
    <FreshOnNavigate>
      <PostEditor clients={clients} defaultClientId={defaultClientId} />
    </FreshOnNavigate>
  );
}
