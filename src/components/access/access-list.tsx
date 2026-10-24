import { removeAccess, resetAccessPassword } from "@/app/agencia/access-actions";
import { AccessActionsMenu } from "@/components/access/access-actions-menu";

export type AccessRow = { id: string; email: string; full_name: string };

// List of logins with their actions; the current user can't remove themselves.
export function AccessList({ accesses, currentUserId }: { accesses: AccessRow[]; currentUserId?: string }) {
  if (accesses.length === 0) {
    return <p className="rounded-lg bg-pale px-3 py-3 text-muted">Nenhum acesso criado ainda.</p>;
  }

  return (
    <ul className="grid divide-y divide-line rounded-xl border border-line">
      {accesses.map((access) => {
        const isMe = access.id === currentUserId;
        return (
          <li key={access.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {access.full_name || access.email}
                {isMe && <span className="ml-2 rounded bg-chip px-1.5 py-0.5 text-[11px] text-brand">você</span>}
              </div>
              <div className="truncate text-[13px] text-muted">{access.email}</div>
            </div>
            <AccessActionsMenu
              email={access.email}
              resetAction={resetAccessPassword.bind(null, access.id)}
              removeAction={isMe ? undefined : removeAccess.bind(null, access.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
