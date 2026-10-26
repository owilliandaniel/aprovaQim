"use client";

import { useEffect } from "react";

export type ToastMessage = { id: number; text: string };

// Short feedback at the bottom of the screen (above the phone tab bar); hides itself.
export function Toast({ message, onDone }: { message: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6"
    >
      {message && (
        <p key={message.id} className="rounded-lg bg-[#241238] px-4 py-3 text-white shadow-[0_8px_30px_#0002]">
          {message.text}
        </p>
      )}
    </div>
  );
}
