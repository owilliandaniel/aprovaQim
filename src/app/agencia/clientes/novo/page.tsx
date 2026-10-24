import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/page-header";
import { cardClass } from "@/components/ui";
import { hasAdminKey } from "@/lib/supabase/admin";
import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
  return (
    <>
      <Link href="/agencia/clientes" className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#4b2580]">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>
      <PageHeader
        eyebrow="Clientes"
        title="Novo cliente"
        subtitle="Cadastre a empresa e o login que ela vai usar para aprovar os conteúdos."
      />
      {!hasAdminKey() && (
        <p className="mb-4 max-w-xl rounded-lg bg-warn-bg px-3 py-2 text-warn">
          A chave SUPABASE_SECRET_KEY não está configurada no servidor, então ainda não é possível criar logins.
        </p>
      )}
      <div className={`${cardClass} max-w-xl p-5 md:p-6`}>
        <FreshOnNavigate>
          <NewClientForm />
        </FreshOnNavigate>
      </div>
    </>
  );
}
