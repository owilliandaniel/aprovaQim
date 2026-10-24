import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ClientCalendarPage() {
  return (
    <>
      <PageHeader eyebrow="Calendário" title="Calendário" subtitle="Seus conteúdos organizados por data." />
      <EmptyState title="Em breve">Aqui você vai ver os conteúdos do mês em formato de calendário.</EmptyState>
    </>
  );
}
