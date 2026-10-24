"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Submit button that disables itself while its form is sending.
export function SubmitButton({
  className,
  pendingLabel,
  disabled,
  children,
}: {
  className: string;
  pendingLabel?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
