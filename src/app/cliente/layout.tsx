import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/nav-list";

const nav: NavItem[] = [
  { href: "/cliente", label: "Conteúdos", icon: "home" },
  { href: "/cliente/calendario", label: "Calendário", icon: "calendar" },
];

export default function ClientLayout({ children }: LayoutProps<"/cliente">) {
  return (
    <AppShell root="/cliente" nav={nav} showHelp>
      {children}
    </AppShell>
  );
}
