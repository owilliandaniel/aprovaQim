// AprovaQim wordmark.
export function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={`whitespace-nowrap text-[26px] font-extrabold tracking-[-1.5px] ${className}`}>
      Aprova<span className="text-brand">QIM</span>
      <span className="ml-0.5 align-super text-xs text-brand-2">✦</span>
    </div>
  );
}
