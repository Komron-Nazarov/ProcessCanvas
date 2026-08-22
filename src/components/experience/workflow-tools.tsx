"use client";

import { Download, FileJson, LayoutTemplate, Upload } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getWorkflowTemplates } from "@/data/workflow-templates";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import { MAX_WORKFLOW_FILE_BYTES, parseWorkflowFile, serializeWorkflowFile, workflowFilename, type WorkflowFileError } from "@/lib/workflow-file";
import { useEditorStore } from "@/store/editor-store";

export function WorkflowTools({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const { notify } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<WorkflowFileError | null>(null);
  const workflowName = useEditorStore((state) => state.workflowName);
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const load = useEditorStore((state) => state.loadLocalWorkflow);
  const templates = useMemo(() => getWorkflowTemplates(locale), [locale]);
  const download = () => { const blob = new Blob([serializeWorkflowFile(workflowName, nodes, edges)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = workflowFilename(workflowName); document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); notify(t("toast.exported")); };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; setError(null); if (!file) return; if (file.size > MAX_WORKFLOW_FILE_BYTES) { setError("too_large"); return; } const parsed = parseWorkflowFile(await file.text()); if (!parsed.ok) { setError(parsed.error); return; } if (!window.confirm(t("tools.confirmImport"))) return; load(parsed.value.workflow.name, parsed.value.workflow.nodes, parsed.value.workflow.edges); notify(t("toast.imported")); onClose(); };
  const applyTemplate = (index: number) => { const template = templates[index]; if (!template || !window.confirm(t("tools.confirmTemplate"))) return; load(template.name, template.nodes, template.edges); notify(t("toast.template")); onClose(); };
  const errorKey = error ? `tools.error.${error}` as const : null;
  return <Modal title={t("tools.title")} onClose={onClose} width="max-w-3xl"><div className="p-5"><div className="grid gap-3 sm:grid-cols-2"><button className="rounded-xl border border-line bg-canvas p-4 text-left transition hover:border-brand" onClick={download}><Download size={18} className="text-brand" /><strong className="mt-3 block text-xs">{t("tools.export")}</strong><span className="mt-1 block text-[10px] leading-5 text-muted">{t("tools.exportText")}</span></button><button className="rounded-xl border border-line bg-canvas p-4 text-left transition hover:border-brand" onClick={() => input.current?.click()}><Upload size={18} className="text-brand" /><strong className="mt-3 block text-xs">{t("tools.import")}</strong><span className="mt-1 block text-[10px] leading-5 text-muted">{t("tools.importText")}</span></button></div><input ref={input} className="hidden" type="file" accept="application/json,.json" onChange={importFile} />{errorKey && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-200">{t(errorKey)}</p>}<div className="mt-6 flex items-center gap-2"><LayoutTemplate size={16} className="text-brand" /><h3 className="text-xs font-bold">{t("tools.templates")}</h3></div><div className="mt-3 grid gap-3 md:grid-cols-3">{templates.map((template, index) => <article key={template.id} className="rounded-xl border border-line bg-canvas p-4"><FileJson size={17} className="text-brand" /><h4 className="mt-3 text-xs font-bold">{template.name}</h4><p className="mt-1 min-h-10 text-[10px] leading-5 text-muted">{template.description}</p><div className="mt-3 text-[8px] font-extrabold uppercase tracking-[.12em] text-muted">{t("tools.structure")}</div><div className="mt-1.5 flex flex-wrap gap-1">{template.nodes.map((node) => <span key={node.id} className="rounded-md border border-line bg-surface px-1.5 py-1 text-[8px] font-bold text-ink">{t(`node.${node.type}` as TranslationKey)}</span>)}</div><div className="mt-2 text-[9px] font-semibold text-muted">{t("tools.templateMeta", { nodes: template.nodes.length, edges: template.edges.length })}</div><button className="secondary-button mt-4 w-full justify-center" onClick={() => applyTemplate(index)}>{t("tools.useTemplate")}</button></article>)}</div></div></Modal>;
}
