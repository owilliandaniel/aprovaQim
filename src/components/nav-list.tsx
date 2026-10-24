import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FolderOpen,
  House,
  LayoutDashboard,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons = {
  home: House,
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  library: FolderOpen,
  comments: MessageSquare,
  clients: Building2,
  team: Users,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof icons };

// Sidebar links on desktop, a scrollable row on mobile; highlights activeHref.
export function NavList({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] md:grid md:overflow-visible">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-10 shrink-0 items-center gap-3 rounded-xl px-4 whitespace-nowrap transition md:h-[46px] ${
              active ? "bg-[#ece3f8] text-brand" : "text-[#514568] hover:bg-pale"
            }`}
          >
            {active && <span className="absolute inset-y-2 left-0 hidden w-1 rounded-r bg-brand md:block" />}
            <Icon size={19} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
