import { Check, CircleCheck, ClipboardList, GitBranch, Play, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { useEditorStore } from "@/store/editor-store";
import type { WorkflowNodeType } from "@/types/workflow";

const items: { type: WorkflowNodeType; label: string; hint: string; icon: LucideIcon; color: string }[] = [
  { type: "start", label: "Start", hint: "Entry point", icon: Play, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  { type: "task", label: "Task", hint: "Action step", icon: ClipboardList, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
  { type: "approval", label: "Approval", hint: "Human review", icon: Check, color: "text-violet-600 bg-violet-50 dark:bg-violet-950" },
  { type: "condition", label: "Condition", hint: "Yes / No split", icon: GitBranch, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  { type: "end", label: "End", hint: "Completion", icon: CircleCheck, color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
];

export function NodePalette() {
  const addNode = useEditorStore((state) => state.addNode);
  return (
    <aside className="z-10 border-r border-line bg-surface px-3 py-5">
      <div className="palette-title px-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">Elements</div>
      <p className="palette-hint px-2 pb-3 pt-1 text-[11px] leading-4 text-muted">Drag to the canvas or click to add.</p>
      <div className="space-y-2">
        {items.map(({ type, label, hint, icon: Icon, color }) => (
          <button
            key={type}
            draggable
            onDragStart={(event) => { event.dataTransfer.setData("application/processcanvas", type); event.dataTransfer.effectAllowed = "move"; }}
            onClick={() => addNode(type)}
            className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left transition hover:-translate-y-px hover:border-brand/50 hover:shadow-sm active:translate-y-0"
            aria-label={`Add ${label} node`}
          >
            <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}><Icon size={17} /></span>
            <span className="palette-copy min-w-0"><span className="block text-xs font-semibold text-ink">{label}</span><span className="block text-[10px] text-muted">{hint}</span></span>
          </button>
        ))}
      </div>
      <div className="palette-hint mt-6 rounded-xl border border-dashed border-line bg-canvas p-3 text-[10px] leading-4 text-muted"><strong className="text-ink">Quick tip</strong><br />Select an element to edit its properties. Connect nodes by dragging their handles.</div>
    </aside>
  );
}
