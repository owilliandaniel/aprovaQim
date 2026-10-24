import type { StatusCounts } from "@/lib/post-stats";

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

// Small colored counters: drafts, waiting, changes requested, approved.
export function StatusCountChips({ counts }: { counts: StatusCounts }) {
  const chips = [
    { text: plural(counts.draft, "rascunho", "rascunhos"), className: "bg-[#efedf3] text-[#5d566b]" },
    { text: `${counts.pending} aguardando`, className: "bg-warn-bg text-warn" },
    { text: plural(counts.changes_requested, "ajuste", "ajustes"), className: "bg-danger-bg text-danger" },
    { text: plural(counts.approved, "aprovado", "aprovados"), className: "bg-ok-bg text-ok" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip.className} className={`rounded-md px-2 py-1 text-xs font-semibold ${chip.className}`}>
          {chip.text}
        </span>
      ))}
    </div>
  );
}
