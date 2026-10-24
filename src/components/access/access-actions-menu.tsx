"use client";

import { useActionState } from "react";
import type { AccessFormState } from "@/app/agencia/access-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { CredentialsCard } from "@/components/credentials-card";
import { FormMessage } from "@/components/form-message";
import { buttonDanger, buttonGhost, buttonSmall } from "@/components/ui";

type Action = (prev: AccessFormState) => Promise<AccessFormState>;

// "New password" and "remove" buttons for one login row.
export function AccessActionsMenu({ email, resetAction, removeAction }: {
  email: string;
  resetAction: Action;
  removeAction?: Action;
}) {
  return (
    <div className="flex flex-wrap items-start gap-1.5">
      <ResetPassword email={email} action={resetAction} />
      {removeAction && <RemoveAccess email={email} action={removeAction} />}
    </div>
  );
}

function ResetPassword({ email, action }: { email: string; action: Action }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <div className="grid gap-2">
      <form action={formAction}>
        <ConfirmButton
          message={`Gerar uma nova senha para ${email}? A senha atual deixa de funcionar.`}
          className={`${buttonGhost} ${buttonSmall}`}
          pendingLabel="Gerando..."
        >
          Nova senha
        </ConfirmButton>
      </form>
      {state.credentials && <CredentialsCard title="Nova senha gerada" {...state.credentials} />}
      <FormMessage error={state.error} />
    </div>
  );
}

function RemoveAccess({ email, action }: { email: string; action: Action }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <div className="grid gap-2">
      <form action={formAction}>
        <ConfirmButton
          message={`Remover o acesso de ${email}?`}
          className={`${buttonDanger} ${buttonSmall}`}
          pendingLabel="Removendo..."
        >
          Remover
        </ConfirmButton>
      </form>
      <FormMessage error={state.error} />
    </div>
  );
}
