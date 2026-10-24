import { removeAccess, resetAccessPassword } from "@/app/agencia/access-actions";
import { AccessRow } from "@/components/access/access-row";

export type AccessRowData = { id: string; email: string; full_name: string };

// List of logins with their actions; the current user can't remove themselves.
export function AccessList({ accesses, currentUserId }: { accesses: AccessRowData[]; currentUserId?: string }) {
  if (accesses.length === 0) {
    return <p className="rounded-lg bg-pale px-3 py-3 text-muted">Nenhum acesso criado ainda.</p>;
  }

  return (
    <ul className="grid divide-y divide-line rounded-xl border border-line">
      {accesses.map((access) => {
        const isMe = access.id === currentUserId;
        return (
          <AccessRow
            key={access.id}
            name={access.full_name}
            email={access.email}
            isMe={isMe}
            resetAction={resetAccessPassword.bind(null, access.id)}
            removeAction={isMe ? undefined : removeAccess.bind(null, access.id)}
          />
        );
      })}
    </ul>
  );
}
