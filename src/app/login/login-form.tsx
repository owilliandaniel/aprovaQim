"use client";

import { useActionState } from "react";
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
          className="rounded-lg border border-line px-3 py-2.5 outline-brand-2"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-line px-3 py-2.5 outline-brand-2"
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
        className="mt-1 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
