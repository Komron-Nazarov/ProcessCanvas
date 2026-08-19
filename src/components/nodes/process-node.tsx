import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, CircleCheck, ClipboardList, GitBranch, Play, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import type { WorkflowNode, WorkflowNodeType } from "@/types/workflow";

const nodeMeta: Record<WorkflowNodeType, { icon: LucideIcon; label: string; tone: string; iconTone: string }> = {
  start: { icon: Play, label: "Start", tone: "border-emerald-300 dark:border-emerald-700", iconTone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  task: { icon: ClipboardList, label: "Task", tone: "border-blue-300 dark:border-blue-700", iconTone: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  approval: { icon: Check, label: "Approval", tone: "border-violet-300 dark:border-violet-700", iconTone: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" },
  condition: { icon: GitBranch, label: "Condition", tone: "border-amber-300 dark:border-amber-700", iconTone: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  end: { icon: CircleCheck, label: "End", tone: "border-slate-300 dark:border-slate-600", iconTone: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

export function ProcessNode({ data, type, selected }: NodeProps<WorkflowNode>) {
  const meta = nodeMeta[type];
  const Icon = meta.icon;
  const isStart = type === "start";
  const isEnd = type === "end";
  const isCondition = type === "condition";

  return (
    <div className={clsx(
      "relative w-[220px] rounded-xl border bg-surface px-3.5 py-3 shadow-node transition-[border,box-shadow,transform]",
      meta.tone,
      selected && "ring-2 ring-brand ring-offset-2 ring-offset-canvas",
    )}>
      {!isStart && <Handle type="target" position={Position.Left} aria-label="Incoming connection" />}
      <div className="flex items-start gap-3">
        <span className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconTone)}>
          <Icon size={16} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{meta.label}</div>
          <div className="truncate text-[13px] font-semibold text-ink" title={data.label}>{data.label}</div>
          {data.assignee && <div className="mt-1 truncate text-[11px] text-muted">{data.assignee}{data.duration ? ` · ${data.duration}` : ""}</div>}
        </div>
      </div>
      {!isEnd && !isCondition && <Handle type="source" position={Position.Right} aria-label="Outgoing connection" />}
      {isCondition && (
        <>
          <span className="absolute -right-1 top-[13px] translate-x-full text-[9px] font-semibold text-emerald-600">YES</span>
          <Handle id="yes" type="source" position={Position.Right} style={{ top: 20, background: "#10b981" }} aria-label="Yes branch" />
          <span className="absolute -right-1 bottom-[13px] translate-x-full text-[9px] font-semibold text-rose-500">NO</span>
          <Handle id="no" type="source" position={Position.Right} style={{ top: "auto", bottom: 20, background: "#f43f5e" }} aria-label="No branch" />
        </>
      )}
    </div>
  );
}
