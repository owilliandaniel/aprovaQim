"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Submit button that asks for confirmation first.
export function ConfirmButton({
  message,
  className,
  pendingLabel,
  children,
}: {
  message: string;
  className: string;
  pendingLabel?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
