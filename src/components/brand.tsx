import Link from "next/link";

// AprovaQim wordmark; links to href when given (44px tap target on phones).
export function Brand({ className = "", href }: { className?: string; href?: string }) {
  const classes = `whitespace-nowrap font-extrabold tracking-[-1.5px] ${className}`;
  const wordmark = (
    <span>
      Aprova<span className="text-brand">QIM</span>
      <span className="ml-0.5 align-super text-xs text-brand-2">✦</span>
    </span>
  );

  if (!href) return <div className={classes}>{wordmark}</div>;
  return (
    <Link
      href={href}
      aria-label="AprovaQIM, ir para o início"
      className={`flex min-h-11 w-fit items-center transition hover:opacity-80 md:min-h-0 ${classes}`}
    >
      {wordmark}
    </Link>
  );
}
