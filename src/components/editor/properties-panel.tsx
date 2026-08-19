import { Clock3, Copy, MousePointer2, Trash2, UserRound } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

const typeLabel = { start: "Start event", task: "Task", approval: "Approval", condition: "Condition", end: "End event" } as const;

export function PropertiesPanel() {
  const selectedId = useEditorStore((state) => state.selectedNodeId);
  const node = useEditorStore((state) => state.nodes.find((item) => item.id === selectedId));
  const updateNode = useEditorStore((state) => state.updateNode);
  const duplicate = useEditorStore((state) => state.duplicateSelected);
  const remove = useEditorStore((state) => state.deleteSelected);

  if (!node) {
    return (
      <aside className="z-10 border-l border-line bg-surface p-5">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Properties</div>
        <div className="flex h-[calc(100%-32px)] flex-col items-center justify-center px-3 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-muted"><MousePointer2 size={21} /></span>
          <h2 className="text-sm font-semibold">Select an element</h2>
          <p className="mt-1.5 max-w-[210px] text-[11px] leading-5 text-muted">Choose a node on the canvas to configure its details, owner and timing.</p>
        </div>
      </aside>
    );
  }

  const fieldClass = "mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink transition placeholder:text-muted focus:border-brand focus:bg-surface";
  return (
    <aside className="z-10 overflow-y-auto border-l border-line bg-surface p-5">
      <div className="flex items-center justify-between"><div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Properties</div><span className="rounded-md bg-canvas px-2 py-1 text-[10px] font-semibold text-muted">{typeLabel[node.type]}</span></div>
      <div className="mt-5 space-y-5">
        <label className="block text-[11px] font-semibold text-ink">Name<input className={fieldClass} value={node.data.label} onChange={(event) => updateNode(node.id, { label: event.target.value })} /></label>
        <label className="block text-[11px] font-semibold text-ink">Description<textarea rows={4} className={`${fieldClass} resize-none leading-5`} value={node.data.description} onChange={(event) => updateNode(node.id, { description: event.target.value })} placeholder="What happens at this step?" /></label>
        <label className="block text-[11px] font-semibold text-ink"><span className="flex items-center gap-1.5"><UserRound size={13} />Responsible</span><input className={fieldClass} value={node.data.assignee} onChange={(event) => updateNode(node.id, { assignee: event.target.value })} placeholder="Person or team" /></label>
        <label className="block text-[11px] font-semibold text-ink"><span className="flex items-center gap-1.5"><Clock3 size={13} />Due time</span><input className={fieldClass} value={node.data.duration} onChange={(event) => updateNode(node.id, { duration: event.target.value })} placeholder="e.g. 4 hours" /></label>
      </div>
      <div className="mt-6 border-t border-line pt-4">
        <div className="flex gap-2">
          <button onClick={duplicate} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-semibold transition hover:bg-canvas" aria-label="Duplicate selected node"><Copy size={13} />Duplicate</button>
          <button onClick={remove} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950" aria-label="Delete selected node"><Trash2 size={13} />Delete</button>
        </div>
        <p className="mt-3 text-center text-[9px] text-muted">⌘/Ctrl + D to duplicate · Delete to remove</p>
      </div>
    </aside>
  );
}
