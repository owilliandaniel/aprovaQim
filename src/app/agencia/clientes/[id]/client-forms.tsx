"use client";

import { useActionState } from "react";
import type { AccessFormState } from "@/app/agencia/access-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { buttonDanger, buttonPrimary, inputClass, labelClass, labelTextClass } from "@/components/ui";

export function EditClientForm({ action, name, instagram }: {
  action: (prev: AccessFormState, formData: FormData) => Promise<AccessFormState>;
  name: string;
  instagram: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3">
      <label className={labelClass}>
        <span className={labelTextClass}>Nome da empresa</span>
        <input name="name" required defaultValue={state.values?.name ?? name} className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>Instagram</span>
        <input name="instagram" defaultValue={state.values?.instagram ?? instagram} placeholder="@empresa" className={inputClass} />
      </label>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className={`${buttonPrimary} justify-self-start`} pendingLabel="Salvando...">
        Salvar
      </SubmitButton>
    </form>
  );
}

// Inactivate / reactivate button; the page re-renders with the new status.
export function ClientStatusForm({ action, name, active }: {
  action: (prev: AccessFormState) => Promise<AccessFormState>;
  name: string;
  active: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-2">
      {active ? (
        <ConfirmButton
          message={`Inativar ${name}? Ninguém da empresa vai conseguir entrar até você reativar. Os conteúdos ficam guardados.`}
          className={`${buttonDanger} sm:justify-self-start`}
          pendingLabel="Inativando..."
        >
          Inativar cliente
        </ConfirmButton>
      ) : (
        <ConfirmButton
          message={`Reativar ${name}? O acesso da empresa volta na hora.`}
          className={`${buttonPrimary} sm:justify-self-start`}
          pendingLabel="Reativando..."
        >
          Reativar cliente
        </ConfirmButton>
      )}
      <FormMessage error={state.error} />
    </form>
  );
}

export function DeleteClientForm({ action, name }: {
  action: (prev: AccessFormState) => Promise<AccessFormState>;
  name: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-2">
      <ConfirmButton
        message={`Excluir ${name}? Todos os conteúdos e acessos da empresa serão apagados.`}
        className={`${buttonDanger} justify-self-start`}
        pendingLabel="Excluindo..."
      >
        Excluir cliente
      </ConfirmButton>
      <FormMessage error={state.error} />
    </form>
  );
}
