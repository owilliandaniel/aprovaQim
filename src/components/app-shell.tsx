import { Suspense, type ReactNode } from "react";
import { Bell, CircleHelp } from "lucide-react";
import { Brand } from "@/components/brand";
import { NavLinks } from "@/components/nav-links";
import { NavList, type NavItem } from "@/components/nav-list";
import { UserMenu, UserMenuSkeleton } from "@/components/user-menu";

type AppShellProps = {
  root: string;
  nav: NavItem[];
  showHelp?: boolean;
  children: ReactNode;
};

// Sidebar + top bar layout shared by the agency and client areas.
export function AppShell({ root, nav, showHelp = false, children }: AppShellProps) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[214px_minmax(0,1fr)]">
      <aside className="border-b border-[#eee8f5] bg-panel px-4 py-3 md:fixed md:inset-y-0 md:left-0 md:flex md:w-[214px] md:flex-col md:border-b-0 md:border-r md:px-3 md:pt-7 md:pb-5">
        <Brand className="mx-1 mb-3 text-[22px] md:mx-3 md:mb-8 md:text-[26px]" />
        {/* Pages with URL params only know the path at request time. */}
        <Suspense fallback={<NavList items={nav} activeHref={null} />}>
          <NavLinks items={nav} root={root} />
        </Suspense>
        {showHelp && (
          <div className="mt-auto hidden items-center gap-3 px-4 py-3 text-xs leading-normal md:flex">
            <CircleHelp size={20} className="text-brand" />
            <div>
              Precisa de ajuda?
              <small className="block text-muted">Fale com a nossa equipe.</small>
            </div>
          </div>
        )}
      </aside>

      <main className="min-w-0 md:col-start-2">
        <header className="flex h-[60px] items-center justify-end gap-5 border-b border-[#eee8f5] bg-[#faf8fd] px-4 md:h-[76px] md:px-8">
          <button
            type="button"
            aria-label="Notificações"
            className="grid size-9 place-items-center rounded-lg text-ink hover:bg-pale"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </header>
        <div className="mx-auto max-w-[1500px] px-3 py-5 md:px-7 md:py-6">{children}</div>
      </main>
    </div>
  );
}
