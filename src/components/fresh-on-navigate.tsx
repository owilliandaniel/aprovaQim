"use client";

import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Next keeps visited pages alive (with state); this resets forms on each new visit,
// while browser back/forward still restores what was typed.
export function FreshOnNavigate({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
