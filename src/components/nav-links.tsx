"use client";

import { usePathname } from "next/navigation";
import { NavList, type NavItem } from "@/components/nav-list";

// NavList with the current page highlighted (the area root only matches exactly).
export function NavLinks({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  const active = items.find(({ href }) =>
    href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`),
  );
  return <NavList items={items} activeHref={active?.href ?? null} />;
}
