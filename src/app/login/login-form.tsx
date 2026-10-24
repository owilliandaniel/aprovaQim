"use client";

import { useActionState } from "react";
import { buttonPrimary, inputClass } from "@/components/ui";
import { signIn, type SignInState } from "@/lib/auth-actions";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} mt-1`}
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
