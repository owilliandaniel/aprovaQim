"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { buttonPrimary, inputClass, labelClass, labelTextClass } from "@/components/ui";
import { changeOwnPassword, type PasswordState } from "@/lib/auth-actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

// Current + new password (twice); "show passwords" helps typing on phones.
export function ChangePasswordForm() {
  const [state, formAction] = useActionState<PasswordState, FormData>(changeOwnPassword, {});
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";

  return (
    <form action={formAction} className="grid gap-3" key={state.success ? "done" : "editing"}>
      <label className={labelClass}>
        <span className={labelTextClass}>Senha atual</span>
        <input name="current" type={type} required autoComplete="current-password" className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>Nova senha (mínimo {MIN_PASSWORD_LENGTH} caracteres)</span>
        <input name="next" type={type} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>Confirmar nova senha</span>
        <input name="confirm" type={type} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px] sm:min-h-0">
        <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="size-4 accent-brand" />
        Mostrar senhas
      </label>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className={`${buttonPrimary} sm:justify-self-start`} pendingLabel="Salvando...">
        Trocar senha
      </SubmitButton>
    </form>
  );
}
