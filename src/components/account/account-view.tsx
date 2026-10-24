import { ChangePasswordForm } from "@/components/account/change-password-form";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { cardClass } from "@/components/ui";
import type { CurrentUser } from "@/lib/auth";

// "Minha conta": who is signed in + change password. Same view for agency and client.
export function AccountView({ user }: { user: CurrentUser }) {
  return (
    <div className="grid max-w-xl gap-4">
      <section className={`${cardClass} grid gap-1 p-5`}>
        <h2 className="mb-1 text-base font-bold">Dados de acesso</h2>
        {user.fullName && <div className="font-semibold">{user.fullName}</div>}
        <div className="break-all text-muted">{user.email}</div>
        {user.clientName && <div className="text-[13px] text-muted">Empresa: {user.clientName}</div>}
      </section>
      <section className={`${cardClass} grid gap-3 p-5`}>
        <h2 className="text-base font-bold">Trocar senha</h2>
        <FreshOnNavigate>
          <ChangePasswordForm />
        </FreshOnNavigate>
      </section>
    </div>
  );
}
