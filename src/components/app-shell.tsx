import { Suspense, type ReactNode } from "react";
import { Bell, CircleHelp } from "lucide-react";
import { Brand } from "@/components/brand";
import { NavLinks, NavTabs } from "@/components/nav-links";
import { NavList, type NavItem } from "@/components/nav-list";
import { UserMenu, UserMenuSkeleton } from "@/components/user-menu";

type AppShellProps = {
  root: string;
  nav: NavItem[];
  showHelp?: boolean;
  children: ReactNode;
};

// Desktop: sidebar + top bar. Mobile: compact sticky top bar + bottom tab bar.
export function AppShell({ root, nav, showHelp = false, children }: AppShellProps) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[214px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#eee8f5] bg-panel px-3 pt-7 pb-5 md:fixed md:inset-y-0 md:left-0 md:flex md:w-[214px] md:flex-col">
        <Brand className="mx-3 mb-8" />
        {/* Pages with URL params only know the path at request time. */}
        <Suspense fallback={<NavList items={nav} activeHref={null} />}>
          <NavLinks items={nav} root={root} />
        </Suspense>
        {showHelp && (
          <div className="mt-auto flex items-center gap-3 px-4 py-3 text-xs leading-normal">
            <CircleHelp size={20} className="text-brand" />
            <div>
              Precisa de ajuda?
              <small className="block text-muted">Fale com a nossa equipe.</small>
            </div>
          </div>
        )}
      </aside>

      <main className="min-w-0 md:col-start-2">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[#eee8f5] bg-[#faf8fd]/95 px-3 backdrop-blur md:static md:h-[76px] md:gap-5 md:px-8">
          <Brand className="ml-1 text-[21px] md:hidden" />
          <div className="ml-auto flex items-center gap-1 md:gap-4">
            <button
              type="button"
              aria-label="Notificações"
              className="grid size-11 place-items-center rounded-lg text-ink hover:bg-pale md:size-9"
            >
              <Bell size={20} strokeWidth={1.8} />
            </button>
            <Suspense fallback={<UserMenuSkeleton />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] px-4 pt-4 pb-28 md:px-7 md:py-6">{children}</div>
      </main>

      <Suspense fallback={null}>
        <NavTabs items={nav} root={root} />
      </Suspense>
    </div>
  );
}
