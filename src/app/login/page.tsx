import { Suspense } from "react";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { LoginForm } from "./login-form";
import { SuspendedNotice } from "./suspended-notice";

export const metadata: Metadata = { title: "Entrar | AprovaQim" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Brand className="mb-8 text-center" />
        <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_8px_30px_#2b134c0d]">
          <h1 className="text-xl font-extrabold tracking-tight">Entrar</h1>
          <p className="mb-6 mt-1 text-muted">Acesse seus conteúdos para aprovar.</p>
          <Suspense fallback={null}>
            <SuspendedNotice />
          </Suspense>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
