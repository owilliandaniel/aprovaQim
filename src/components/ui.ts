// Shared Tailwind class sets for forms, buttons and cards.
// Mobile: 16px inputs (no iOS zoom on focus) and 44px tap targets.
export const inputClass =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-base outline-brand-2 disabled:bg-pale disabled:text-muted sm:text-sm";
export const labelClass = "grid gap-1.5";
export const labelTextClass = "text-xs font-semibold";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0";
export const buttonPrimary = `${buttonBase} bg-brand text-white hover:bg-brand-dark`;
export const buttonSecondary = `${buttonBase} border border-[#b88ce8] bg-white text-[#5d2695] hover:bg-pale`;
export const buttonGhost = `${buttonBase} text-[#492080] hover:bg-pale`;
export const buttonDanger = `${buttonBase} border border-danger/30 bg-white text-danger hover:bg-danger-bg`;
export const buttonSmall = "px-3 py-1.5 text-[13px]";

export const cardClass = "rounded-2xl border border-line bg-white";
