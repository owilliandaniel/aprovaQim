import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// "Back to ..." link with a finger-sized tap area.
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[13px] text-[#4b2580] hover:bg-pale">
      <ArrowLeft size={16} /> {children}
    </Link>
  );
}
