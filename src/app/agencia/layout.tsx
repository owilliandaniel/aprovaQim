import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/nav-list";

const nav: NavItem[] = [
  { href: "/agencia", label: "Painel", icon: "dashboard" },
  { href: "/agencia/conteudos", label: "Conteúdos", icon: "library" },
  { href: "/agencia/clientes", label: "Clientes", icon: "clients" },
  { href: "/agencia/equipe", label: "Equipe", icon: "team" },
];

export default function AgencyLayout({ children }: LayoutProps<"/agencia">) {
  return (
    <AppShell root="/agencia" nav={nav}>
      {children}
    </AppShell>
  );
}
