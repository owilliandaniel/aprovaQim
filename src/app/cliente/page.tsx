import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth";
import { postStatusLabel, postTypeLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export default function ClientContentPage() {
  return (
    <>
      <PageHeader
        eyebrow="Conteúdos"
        title="Conteúdos para aprovar"
        subtitle="Confira os materiais e aprove ou solicite ajustes."
      />
      <Suspense fallback={<PostGridSkeleton />}>
        <PendingPosts />
      </Suspense>
    </>
  );
}

// Posts waiting for this client's decision (RLS limits rows to the client's own posts).
async function PendingPosts() {
  await requireRole("client");
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, type, title, caption, planned_date, status")
    .eq("status", "pending")
    .order("planned_date");

  if (!posts?.length) {
    return (
      <EmptyState title="Nenhum conteúdo para aprovar">
        Quando a agência enviar novos materiais, eles aparecem aqui.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-[13px] border border-[#e9e3f1] bg-[#fbfaff] p-3">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-chip px-2 py-1 text-xs font-semibold text-brand">
              {postTypeLabel[post.type]}
            </span>
            <span className="text-xs text-muted">{postStatusLabel[post.status]}</span>
          </div>
          <div className="mt-1 text-xs text-[#796b9b]">
            {new Date(`${post.planned_date}T12:00:00`).toLocaleDateString("pt-BR")}
          </div>
          <h2 className="mt-2 font-semibold">{post.title}</h2>
          <p className="mt-1 line-clamp-2 text-[13px] text-[#1f1630]">{post.caption}</p>
        </article>
      ))}
    </div>
  );
}

function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-[13px] border border-line bg-white" />
      ))}
    </div>
  );
}
