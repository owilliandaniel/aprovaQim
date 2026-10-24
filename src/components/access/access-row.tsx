"use client";

import { useActionState } from "react";
import type { AccessFormState } from "@/app/agencia/access-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { CredentialsCard } from "@/components/credentials-card";
import { FormMessage } from "@/components/form-message";
import { buttonDanger, buttonGhost, buttonSmall } from "@/components/ui";

type Action = (prev: AccessFormState) => Promise<AccessFormState>;
const noAction: Action = async () => ({});

// One login: name/email with "new password" and "remove"; a new password shows below the row.
export function AccessRow({ name, email, isMe, resetAction, removeAction }: {
  name: string;
  email: string;
  isMe: boolean;
  resetAction: Action;
  removeAction?: Action;
}) {
  const [resetState, reset] = useActionState(resetAction, {});
  const [removeState, remove] = useActionState(removeAction ?? noAction, {});

  return (
    <li className="grid gap-2 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {name || email}
            {isMe && <span className="ml-2 rounded bg-chip px-1.5 py-0.5 text-[11px] text-brand">você</span>}
          </div>
          <div className="truncate text-[13px] text-muted">{email}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <form action={reset}>
            <ConfirmButton
              message={`Gerar uma nova senha para ${email}? A senha atual deixa de funcionar.`}
              className={`${buttonGhost} ${buttonSmall}`}
              pendingLabel="Gerando..."
            >
              Nova senha
            </ConfirmButton>
          </form>
          {removeAction && (
            <form action={remove}>
              <ConfirmButton
                message={`Remover o acesso de ${email}?`}
                className={`${buttonDanger} ${buttonSmall}`}
                pendingLabel="Removendo..."
              >
                Remover
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
      {resetState.credentials && <CredentialsCard title="Nova senha gerada" {...resetState.credentials} />}
      <FormMessage error={resetState.error ?? removeState.error} />
    </li>
  );
}
