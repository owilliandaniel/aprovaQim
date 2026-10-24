"use client";

import { usePathname } from "next/navigation";
import { NavList, TabBarList, type NavItem } from "@/components/nav-list";

// Editor pages hide the mobile tab bar so the form and its actions get the whole screen.
const FOCUS_PATHS = /^\/agencia\/conteudos\/.+/;

// Current item: the area root only matches exactly, others match their sub-pages too.
function useActiveHref(items: NavItem[], root: string) {
  const pathname = usePathname();
  const active = items.find(({ href }) =>
    href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`),
  );
  return { pathname, activeHref: active?.href ?? null };
}

export function NavLinks({ items, root }: { items: NavItem[]; root: string }) {
  const { activeHref } = useActiveHref(items, root);
  return <NavList items={items} activeHref={activeHref} />;
}

export function NavTabs({ items, root }: { items: NavItem[]; root: string }) {
  const { pathname, activeHref } = useActiveHref(items, root);
  if (FOCUS_PATHS.test(pathname)) return null;
  return <TabBarList items={items} activeHref={activeHref} />;
}
