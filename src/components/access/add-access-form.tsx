"use client";

import { useActionState, useState } from "react";
import type { AccessFormState } from "@/app/agencia/access-actions";
import { CredentialsCard } from "@/components/credentials-card";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { buttonPrimary, buttonSecondary, inputClass, labelClass, labelTextClass } from "@/components/ui";

type Action = (prev: AccessFormState, formData: FormData) => Promise<AccessFormState>;

// Form to create a login (email + optional password); shows the credentials once.
export function AddAccessForm({ action, nameRequired = false, submitLabel = "Criar acesso" }: {
  action: Action;
  nameRequired?: boolean;
  submitLabel?: string;
}) {
  const [formKey, setFormKey] = useState(0);
  return <AccessForm key={formKey} action={action} nameRequired={nameRequired} submitLabel={submitLabel} onReset={() => setFormKey((k) => k + 1)} />;
}

function AccessForm({ action, nameRequired, submitLabel, onReset }: {
  action: Action;
  nameRequired: boolean;
  submitLabel: string;
  onReset: () => void;
}) {
  const [state, formAction] = useActionState(action, {});

  if (state.credentials) {
    return (
      <div className="grid gap-3">
        <CredentialsCard title="Acesso criado" {...state.credentials} />
        <button type="button" onClick={onReset} className={buttonSecondary}>
          Criar outro acesso
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <label className={labelClass}>
        <span className={labelTextClass}>Nome{nameRequired ? "" : " (opcional)"}</span>
        <input name="fullName" required={nameRequired} className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>E-mail de acesso</span>
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>Senha</span>
        <input name="password" type="text" minLength={8} placeholder="Deixe em branco para gerar" className={inputClass} />
      </label>
      <FormMessage error={state.error} />
      <SubmitButton className={buttonPrimary} pendingLabel="Criando...">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
