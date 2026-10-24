import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function AgencyClientsPage() {
  return (
    <>
      <PageHeader eyebrow="Clientes" title="Clientes" subtitle="Empresas atendidas e seus acessos." />
      <EmptyState title="Em breve">Aqui você vai cadastrar clientes e criar o login de cada um.</EmptyState>
    </>
  );
}
