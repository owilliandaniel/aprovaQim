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
        <input name="name" required defaultValue={name} className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>Instagram</span>
        <input name="instagram" defaultValue={instagram} placeholder="@empresa" className={inputClass} />
      </label>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className={`${buttonPrimary} justify-self-start`} pendingLabel="Salvando...">
        Salvar
      </SubmitButton>
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
