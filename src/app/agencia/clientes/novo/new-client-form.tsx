"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createClientWithAccess } from "@/app/agencia/access-actions";
import { CredentialsCard } from "@/components/credentials-card";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { buttonPrimary, buttonSecondary, inputClass, labelClass, labelTextClass } from "@/components/ui";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export function NewClientForm() {
  const [formKey, setFormKey] = useState(0);
  return <Form key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}

// Company data + first login; after saving shows the credentials to send to the client.
function Form({ onReset }: { onReset: () => void }) {
  const [state, formAction] = useActionState(createClientWithAccess, {});

  if (state.credentials && state.clientId) {
    return (
      <div className="grid gap-4">
        <FormMessage success={state.success} />
        <CredentialsCard title="Login do cliente" {...state.credentials} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/agencia/conteudos/novo?cliente=${state.clientId}`} className={buttonPrimary}>
            Criar conteúdo
          </Link>
          <Link href={`/agencia/clientes/${state.clientId}`} className={buttonSecondary}>
            Gerenciar cliente
          </Link>
          <button type="button" onClick={onReset} className={buttonSecondary}>
            Cadastrar outro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <fieldset className="grid gap-3">
        <legend className="mb-1 font-bold">Empresa</legend>
        <label className={labelClass}>
          <span className={labelTextClass}>Nome da empresa</span>
          <input name="name" required defaultValue={state.values?.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Instagram (opcional)</span>
          <input name="instagram" placeholder="@empresa" defaultValue={state.values?.instagram} className={inputClass} />
        </label>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-bold">Login do cliente</legend>
        <label className={labelClass}>
          <span className={labelTextClass}>Nome do contato (opcional)</span>
          <input name="fullName" defaultValue={state.values?.fullName} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>E-mail de acesso</span>
          <input name="email" type="email" required defaultValue={state.values?.email} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Senha</span>
          <input
            name="password"
            type="text"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder="Deixe em branco para gerar"
            defaultValue={state.values?.password}
            className={inputClass}
          />
        </label>
      </fieldset>

      <FormMessage error={state.error} />
      <SubmitButton className={buttonPrimary} pendingLabel="Cadastrando...">
        Cadastrar cliente
      </SubmitButton>
    </form>
  );
}
