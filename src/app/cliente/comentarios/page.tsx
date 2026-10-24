import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ClientCommentsPage() {
  return (
    <>
      <PageHeader eyebrow="Comentários" title="Comentários" subtitle="Conversas sobre cada conteúdo." />
      <EmptyState title="Em breve">Aqui você vai acompanhar os comentários e pedidos de ajuste.</EmptyState>
    </>
  );
}
