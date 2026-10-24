import type { StatusCounts } from "@/lib/post-stats";

// Small colored counters: drafts, waiting, changes requested, approved.
export function StatusCountChips({ counts }: { counts: StatusCounts }) {
  const chips = [
    { value: counts.draft, label: "rascunhos", className: "bg-[#efedf3] text-[#5d566b]" },
    { value: counts.pending, label: "aguardando", className: "bg-warn-bg text-warn" },
    { value: counts.changes_requested, label: "ajustes", className: "bg-danger-bg text-danger" },
    { value: counts.approved, label: "aprovados", className: "bg-ok-bg text-ok" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip.label} className={`rounded-md px-2 py-1 text-xs font-semibold ${chip.className}`}>
          {chip.value} {chip.label}
        </span>
      ))}
    </div>
  );
}
