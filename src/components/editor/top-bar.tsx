import { Box, Moon, Play, Redo2, Sun, Undo2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

type TopBarProps = { dark: boolean; onToggleTheme: () => void };

export function TopBar({ dark, onToggleTheme }: TopBarProps) {
  const workflowName = useEditorStore((state) => state.workflowName);
  const setWorkflowName = useEditorStore((state) => state.setWorkflowName);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-4 lg:px-5">
      <div className="flex min-w-[205px] items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm"><Box size={19} /></span>
        <div><div className="text-sm font-bold tracking-tight">ProcessCanvas</div><div className="text-[10px] font-medium text-muted">Workflow Studio</div></div>
      </div>
      <div className="h-7 w-px bg-line" />
      <div className="min-w-0 flex-1">
        <input
          aria-label="Workflow name"
          value={workflowName}
          onChange={(event) => setWorkflowName(event.target.value)}
          className="w-full max-w-[360px] rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-line focus:border-brand focus:bg-canvas"
        />
        <div className="ml-2 mt-0.5 flex items-center gap-1.5 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Draft · All changes saved locally</div>
      </div>
      <div className="flex items-center gap-1">
        <button disabled aria-label="Undo (coming soon)" title="Undo history is coming in PC-2" className="rounded-lg p-2 text-muted opacity-45"><Undo2 size={17} /></button>
        <button disabled aria-label="Redo (coming soon)" title="Redo history is coming in PC-2" className="rounded-lg p-2 text-muted opacity-45"><Redo2 size={17} /></button>
        <button onClick={onToggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"} title={dark ? "Light theme" : "Dark theme"} className="rounded-lg p-2 text-muted transition hover:bg-canvas hover:text-ink">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button disabled title="Run simulation will be available in PC-2" className="ml-2 flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white opacity-55" aria-label="Run workflow (coming soon)"><Play size={14} fill="currentColor" />Run</button>
      </div>
    </header>
  );
}
