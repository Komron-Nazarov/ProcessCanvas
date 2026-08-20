"use client";

import { Check, CircleCheck, ClipboardList, FilePlus2, GitBranch, Play, RotateCcw, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import { useEditorStore } from "@/store/editor-store";
import type { WorkflowNodeType } from "@/types/workflow";
import { useToast } from "@/components/ui/toast";

const items: { type: WorkflowNodeType; label: TranslationKey; hint: TranslationKey; icon: LucideIcon; color: string }[] = [
  { type: "start", label: "palette.start", hint: "palette.startHint", icon: Play, color: "node-icon-start" }, { type: "task", label: "palette.task", hint: "palette.taskHint", icon: ClipboardList, color: "node-icon-task" }, { type: "approval", label: "palette.approval", hint: "palette.approvalHint", icon: Check, color: "node-icon-approval" }, { type: "condition", label: "palette.condition", hint: "palette.conditionHint", icon: GitBranch, color: "node-icon-condition" }, { type: "end", label: "palette.end", hint: "palette.endHint", icon: CircleCheck, color: "node-icon-end" },
];

export function NodePalette() {
  const { t } = useI18n(); const { notify } = useToast(); const addNode = useEditorStore((state) => state.addNode); const clearWorkflow = useEditorStore((state) => state.clearWorkflow); const restoreDemo = useEditorStore((state) => state.restoreDemo);
  return <aside className="palette z-10 flex min-h-0 flex-col border-r border-line bg-surface px-3 py-5"><div className="palette-title px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">{t("palette.title")}</div><p className="palette-hint px-2 pb-3 pt-1.5 text-[10px] leading-4 text-muted">{t("palette.subtitle")}</p><div className="space-y-1.5">{items.map(({ type, label, hint, icon: Icon, color }) => <button key={type} draggable onDragStart={(event) => { event.dataTransfer.setData("application/processcanvas", type); event.dataTransfer.effectAllowed = "move"; }} onClick={() => { addNode(type); notify(t("toast.added")); }} className="palette-item group flex w-full items-center gap-3 rounded-[10px] border border-transparent p-2 text-left transition hover:border-line hover:bg-canvas active:scale-[.99]" aria-label={`${t(label)} — ${t(hint)}`} title={t(hint)}><span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]", color)}><Icon size={17} strokeWidth={1.9} /></span><span className="palette-copy min-w-0"><span className="block text-[11px] font-bold text-ink">{t(label)}</span><span className="mt-0.5 block truncate text-[9px] text-muted">{t(hint)}</span></span></button>)}</div><div className="palette-hint mt-5 border-l-2 border-brand/50 pl-3 text-[9px] leading-4 text-muted"><strong className="block text-[10px] text-ink">{t("palette.tipTitle")}</strong>{t("palette.tip")}</div><div className="mt-auto grid gap-1.5 border-t border-line pt-3"><button onClick={() => { clearWorkflow(); notify(t("toast.empty")); }} className="palette-action"><FilePlus2 size={14} />{t("palette.new")}</button><button onClick={() => { restoreDemo(); notify(t("toast.demo")); }} className="palette-action"><RotateCcw size={14} />{t("palette.demo")}</button></div></aside>;
}
