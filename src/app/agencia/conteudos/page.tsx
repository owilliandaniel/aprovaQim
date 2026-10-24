import { Suspense } from "react";
import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmitButton } from "@/components/submit-button";
import { buttonPrimary, buttonSecondary } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatMonth, monthRange } from "@/lib/format";
import { driveFileId, driveThumbnailUrl, mediaRuleError } from "@/lib/media";
import { signMediaPaths } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { sendDraftsAction } from "./actions";
import { FilterBar } from "./filter-bar";
import { contentHref, parseContentFilters, type ContentFilters } from "./filters";
import { PostCard, type AgencyPost } from "./post-card";

const statusTabs: { status: ContentFilters["status"]; label: string }[] = [
  { status: null, label: "Todos" },
  { status: "draft", label: "Rascunhos" },
  { status: "pending", label: "Aguardando" },
  { status: "changes_requested", label: "Ajustes" },
  { status: "approved", label: "Aprovados" },
];

export default function AgencyContentPage({ searchParams }: PageProps<"/agencia/conteudos">) {
  return (
    <>
      <PageHeader eyebrow="Conteúdos" title="Conteúdos" subtitle="Crie posts, artes e vídeos e envie para o cliente aprovar." />
      <Suspense fallback={<CardGridSkeleton />}>
        {searchParams.then((params) => (
          <ContentView filters={parseContentFilters(params)} />
        ))}
      </Suspense>
    </>
  );
}

async function ContentView({ filters }: { filters: ContentFilters }) {
  await requireRole("agency");
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(
      "id, type, status, title, planned_date, clients(name), post_media(kind, storage_path, external_url, position), comments(body, created_at, is_change_request)",
    )
    .eq("comments.is_change_request", true)
    .order("planned_date", { ascending: Boolean(filters.month) })
    .order("position", { referencedTable: "post_media" })
    .order("created_at", { referencedTable: "comments", ascending: false });
  if (filters.client) query = query.eq("client_id", filters.client);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.month) {
    const { from, to } = monthRange(filters.month);
    query = query.gte("planned_date", from).lt("planned_date", to);
  }

  const [{ data: clients }, { data: posts }] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    query,
  ]);

  if (!clients?.length) {
    return (
      <EmptyState title="Cadastre um cliente primeiro">
        <Link href="/agencia/clientes/novo" className="font-semibold text-brand underline">
          Cadastrar cliente
        </Link>{" "}
        para começar a criar conteúdos.
      </EmptyState>
    );
  }

  const firstImages = (posts ?? []).map((post) => post.post_media[0]?.storage_path).filter(Boolean) as string[];
  const signed = await signMediaPaths(supabase, firstImages);

  const cards: AgencyPost[] = (posts ?? []).map((post) => {
    const first = post.post_media[0];
    const driveId = first?.kind === "video_link" ? driveFileId(first.external_url ?? "") : null;
    const thumbUrl = first?.storage_path ? signed.get(first.storage_path) : driveId ? driveThumbnailUrl(driveId) : null;
    return {
      id: post.id,
      type: post.type,
      status: post.status,
      title: post.title,
      plannedDate: post.planned_date,
      clientName: filters.client ? null : (post.clients?.name ?? null),
      thumb: first && thumbUrl ? { kind: first.kind, url: thumbUrl } : null,
      changeRequest: post.comments[0]?.body ?? null,
      blockedReason: mediaRuleError(post.type, post.post_media.map((media) => media.kind)),
    };
  });
  const readyDrafts = cards.filter((card) => card.status === "draft" && !card.blockedReason).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar clients={clients} filters={filters} />
        <div className="flex flex-wrap gap-2">
          {filters.client && readyDrafts > 0 && (
            <form action={sendDraftsAction.bind(null, filters.client, filters.month)}>
              <SubmitButton className={buttonSecondary} pendingLabel="Enviando...">
                <Send size={16} /> Enviar {readyDrafts} {readyDrafts === 1 ? "rascunho" : "rascunhos"}
              </SubmitButton>
            </form>
          )}
          <Link
            href={filters.client ? `/agencia/conteudos/novo?cliente=${filters.client}` : "/agencia/conteudos/novo"}
            className={buttonPrimary}
          >
            <Plus size={18} /> Novo conteúdo
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Status">
        {statusTabs.map((tab) => {
          const active = tab.status === filters.status;
          return (
            <Link
              key={tab.label}
              href={contentHref({ ...filters, status: tab.status })}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl px-5 py-2.5 ${active ? "bg-brand-dark text-white" : "bg-[#eee9f6] text-[#655a7f] hover:bg-chip"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {cards.length === 0 ? (
        <EmptyState title="Nenhum conteúdo encontrado">
          {filters.month ? `Nada em ${formatMonth(filters.month)} com esses filtros.` : "Crie o primeiro conteúdo para este filtro."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => (
            <PostCard key={card.id} post={card} />
          ))}
        </div>
      )}
    </div>
  );
}
