"use client";

import { useSearchParams } from "next/navigation";

// Shown after a signed-in client is logged out because their company was deactivated.
export function SuspendedNotice() {
  const suspended = useSearchParams().get("suspenso") === "1";
  if (!suspended) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg bg-warn-bg px-3 py-2 text-warn">
      O acesso da sua empresa está suspenso. Fale com a agência.
    </p>
  );
}
