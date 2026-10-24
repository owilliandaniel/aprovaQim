import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ClientLibraryPage() {
  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Biblioteca" subtitle="Todos os conteúdos que você já aprovou." />
      <EmptyState title="Em breve">Aqui ficam os conteúdos aprovados.</EmptyState>
    </>
  );
}
