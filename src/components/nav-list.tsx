import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FolderOpen,
  House,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons = {
  home: House,
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  library: FolderOpen,
  clients: Building2,
  team: Users,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof icons };

// Desktop sidebar links; highlights activeHref.
export function NavList({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  return (
    <nav className="grid gap-1.5">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-[46px] items-center gap-3 rounded-xl px-4 whitespace-nowrap transition ${
              active ? "bg-[#ece3f8] text-brand" : "text-[#514568] hover:bg-pale"
            }`}
          >
            {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-brand" />}
            <Icon size={19} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Mobile bottom tab bar (thumb reach); respects the iPhone home indicator area.
export function TabBarList({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#eee8f5] bg-[#faf8fd]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              active ? "text-brand" : "text-[#7a6f91]"
            }`}
          >
            <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-[#ece3f8]" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.1 : 1.8} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
