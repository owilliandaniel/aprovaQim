import { KeyRound } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

// Shows a login's email and password once, so the agency can send them to the person.
export function CredentialsCard({ email, password, title }: { email: string; password: string; title: string }) {
  const message = `Acesso ao AprovaQim\nE-mail: ${email}\nSenha: ${password}`;
  return (
    <div className="rounded-xl border border-ok/30 bg-ok-bg p-4 text-ok">
      <div className="flex items-center gap-2 font-bold">
        <KeyRound size={16} /> {title}
      </div>
      <p className="mt-1 text-[13px]">Copie e envie para a pessoa. A senha não aparece de novo.</p>
      <dl className="mt-3 grid gap-1 rounded-lg bg-white p-3 text-ink">
        <div className="flex flex-wrap items-center gap-2">
          <dt className="w-14 text-muted">E-mail</dt>
          <dd className="font-semibold break-all">{email}</dd>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <dt className="w-14 text-muted">Senha</dt>
          <dd className="font-mono font-semibold">{password}</dd>
        </div>
      </dl>
      <div className="mt-2">
        <CopyButton text={message} label="Copiar acesso" />
      </div>
    </div>
  );
}
