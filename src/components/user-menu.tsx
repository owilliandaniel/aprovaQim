import Link from "next/link";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { homePathFor } from "@/lib/roles";

// Avatar + name (opens "Minha conta") and logout button for the signed-in user.
export async function UserMenu() {
  const user = await getCurrentUser();
  const name = user.role === "client" ? (user.clientName ?? user.email) : user.fullName || user.email;

  return (
    <div className="flex items-center gap-1 md:gap-3">
      <Link
        href={`${homePathFor(user.role)}/conta`}
        title="Minha conta"
        aria-label="Minha conta"
        className="flex min-h-11 items-center gap-3 rounded-full pr-1 hover:bg-pale md:pr-3"
      >
        <span className="grid size-9 place-items-center rounded-full bg-[#e8def7] text-[15px] font-bold text-brand md:size-10">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-48 truncate text-[13px] md:block">{name}</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          title="Sair"
          aria-label="Sair"
          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-pale hover:text-brand md:size-9"
        >
          <LogOut size={18} />
        </button>
      </form>
    </div>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <span className="size-9 animate-pulse rounded-full bg-line md:size-10" />
      <span className="hidden h-3 w-28 animate-pulse rounded bg-line md:block" />
    </div>
  );
}
