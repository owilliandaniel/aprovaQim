import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function AgencyContentPage() {
  return (
    <>
      <PageHeader eyebrow="Conteúdos" title="Conteúdos" subtitle="Posts, artes e vídeos de cada cliente." />
      <EmptyState title="Em breve">Aqui você vai subir conteúdos e enviá-los para aprovação.</EmptyState>
    </>
  );
}
