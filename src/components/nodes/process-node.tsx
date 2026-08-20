import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, CircleCheck, ClipboardList, GitBranch, Play, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import type { WorkflowNode, WorkflowNodeType } from "@/types/workflow";
import { validateWorkflow } from "@/lib/workflow-validation";
import { useEditorStore } from "@/store/editor-store";

const nodeMeta: Record<WorkflowNodeType, { icon: LucideIcon; label: TranslationKey; tone: string; iconTone: string }> = {
  start: { icon: Play, label: "node.start", tone: "node-tone-start", iconTone: "node-icon-start" },
  task: { icon: ClipboardList, label: "node.task", tone: "node-tone-task", iconTone: "node-icon-task" },
  approval: { icon: Check, label: "node.approval", tone: "node-tone-approval", iconTone: "node-icon-approval" },
  condition: { icon: GitBranch, label: "node.condition", tone: "node-tone-condition", iconTone: "node-icon-condition" },
  end: { icon: CircleCheck, label: "node.end", tone: "node-tone-end", iconTone: "node-icon-end" },
};

export function ProcessNode({ id, data, type, selected }: NodeProps<WorkflowNode>) {
  const { t } = useI18n();
  const invalid = useEditorStore((state) => validateWorkflow(state.nodes, state.edges).nodeIds.has(id));
  const meta = nodeMeta[type];
  const Icon = meta.icon;
  const isStart = type === "start";
  const isEnd = type === "end";
  const isCondition = type === "condition";

  return (
    <div className={clsx(
      "process-node relative w-[220px] rounded-[11px] border bg-surface px-3.5 py-3 shadow-node transition-[border,box-shadow,transform]",
      meta.tone,
      selected && "ring-2 ring-brand ring-offset-2 ring-offset-canvas",
      invalid && "process-node-invalid",
    )}>
      {!isStart && <Handle type="target" position={Position.Left} aria-label={t("node.incoming")} />}
      <div className="flex items-start gap-3">
        <span className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconTone)}>
          <Icon size={16} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">{t(meta.label)}</div>
          <div className="truncate text-[13px] font-semibold text-ink" title={data.label}>{data.label}</div>
          {data.assignee && <div className="mt-1 truncate text-[11px] text-muted">{data.assignee}{data.duration ? ` · ${data.duration}` : ""}</div>}
        </div>
      </div>
      {!isEnd && !isCondition && <Handle type="source" position={Position.Right} aria-label={t("node.outgoing")} />}
      {isCondition && (
        <>
          <span className="absolute -right-1 top-[13px] translate-x-full text-[8px] font-bold text-emerald-600">{t("node.yes")}</span>
          <Handle id="yes" type="source" position={Position.Right} style={{ top: 20, background: "#10b981" }} aria-label={t("node.yesBranch")} />
          <span className="absolute -right-1 bottom-[13px] translate-x-full text-[8px] font-bold text-rose-500">{t("node.no")}</span>
          <Handle id="no" type="source" position={Position.Right} style={{ top: "auto", bottom: 20, background: "#f43f5e" }} aria-label={t("node.noBranch")} />
        </>
      )}
    </div>
  );
}
