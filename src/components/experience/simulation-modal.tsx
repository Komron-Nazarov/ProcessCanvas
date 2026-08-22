"use client";

import { AlertTriangle, CheckCircle2, GitBranch, Play, RotateCcw, Square, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import { validateWorkflow, type ValidationCode } from "@/lib/workflow-validation";
import { nextSimulationNode } from "@/lib/workflow-simulation";
import { useEditorStore } from "@/store/editor-store";

const issueKeys: Record<ValidationCode, TranslationKey> = { start_count: "validation.start", end_missing: "validation.end", required_name: "validation.name", incoming_missing: "validation.incoming", outgoing_missing: "validation.outgoing", condition_branches: "validation.condition", unreachable: "validation.unreachable" };

export function SimulationModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const validation = useMemo(() => validateWorkflow(nodes, edges), [edges, nodes]);
  const startId = nodes.find((node) => node.type === "start")?.id ?? null;
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const current = nodes.find((node) => node.id === currentId);
  const finished = current?.type === "end";
  const begin = () => { setCurrentId(startId); setHistory(startId ? [startId] : []); };
  const advance = (branch?: "yes" | "no") => {
    if (!current) return;
    const next = nextSimulationNode(current.id, edges, branch);
    if (!next) return;
    setCurrentId(next); setHistory((items) => [...items, next]);
  };
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]"><section className="animate-modal w-full max-w-lg rounded-2xl border border-line bg-surface shadow-panel" role="dialog" aria-modal="true" aria-label={t("simulation.title")}><header className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">{t("simulation.title")}</h2><p className="mt-0.5 text-[10px] text-muted">{t("simulation.subtitle")}</p></div><button className="icon-button" onClick={onClose} aria-label={t("dialog.close")}><X size={17} /></button></header><div className="p-5">{!validation.valid ? <><div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><h3 className="text-xs font-bold">{t("validation.title")}</h3><p className="mt-1 text-[10px] leading-5 opacity-80">{t("validation.text")}</p></div></div><ul className="mt-4 grid gap-2">{validation.issues.map((issue, index) => <li key={`${issue.code}-${issue.nodeId ?? index}`} className="flex items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-[10px] text-muted"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{t(issueKeys[issue.code])}</li>)}</ul></> : !current ? <div className="py-7 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Play size={20} /></span><h3 className="mt-4 text-base font-extrabold">{t("simulation.ready")}</h3><p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-muted">{t("simulation.readyText")}</p><button className="primary-button mt-5" onClick={begin}><Play size={13} />{t("simulation.start")}</button></div> : <><div className="rounded-xl border border-line bg-canvas p-4"><div className="text-[9px] font-extrabold uppercase tracking-[.15em] text-brand">{finished ? t("simulation.finished") : t("simulation.current")}</div><h3 className="mt-1 text-base font-extrabold text-ink">{current.data.label}</h3><p className="mt-1 text-[10px] leading-5 text-muted">{current.data.description}</p></div><div className="mt-4"><div className="text-[9px] font-extrabold uppercase tracking-[.14em] text-muted">{t("simulation.history")}</div><div className="mt-2 flex flex-wrap gap-1.5">{history.map((id, index) => <span key={`${id}-${index}`} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[9px] font-bold">{nodes.find((node) => node.id === id)?.data.label}</span>)}</div></div><div className="mt-5 flex flex-wrap justify-end gap-2">{finished ? <><button className="secondary-button" onClick={begin}><RotateCcw size={13} />{t("simulation.restart")}</button><button className="primary-button" onClick={onClose}><CheckCircle2 size={13} />{t("simulation.close")}</button></> : current.type === "condition" ? <><button className="secondary-button" onClick={() => advance("no")}><GitBranch size={13} />{t("node.no")}</button><button className="primary-button" onClick={() => advance("yes")}><GitBranch size={13} />{t("node.yes")}</button></> : <><button className="secondary-button" onClick={() => { setCurrentId(null); setHistory([]); }}><Square size={12} />{t("simulation.stop")}</button><button className="primary-button" onClick={() => advance()}>{t("simulation.next")}</button></>}</div></>}</div></section></div>;
}
