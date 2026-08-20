"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type NodeTypes } from "@xyflow/react";
import { Compass } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import type { WorkflowNodeType } from "@/types/workflow";
import { StartNode } from "@/components/nodes/start-node";
import { TaskNode } from "@/components/nodes/task-node";
import { ApprovalNode } from "@/components/nodes/approval-node";
import { ConditionNode } from "@/components/nodes/condition-node";
import { EndNode } from "@/components/nodes/end-node";
import { I18nProvider, useI18n } from "@/i18n/provider";
import { clearWorkspace, loadWorkspace, saveWorkspace } from "@/lib/persistence";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { IntroScreen } from "@/components/experience/intro-screen";
import { Onboarding } from "@/components/experience/onboarding";
import { AboutModal } from "@/components/experience/about-modal";
import { TopBar } from "./top-bar";
import { NodePalette } from "./node-palette";
import { PropertiesPanel } from "./properties-panel";

const nodeTypes: NodeTypes = { start: StartNode, task: TaskNode, approval: ApprovalNode, condition: ConditionNode, end: EndNode };
const validTypes = new Set<WorkflowNodeType>(["start", "task", "approval", "condition", "end"]);
const miniMapColors: Record<string, string> = { start: "#22a06b", task: "#3975d3", approval: "#7856c8", condition: "#d48a19", end: "#68758a" };

function EditorCanvas() {
  const { t } = useI18n(); const { notify } = useToast();
  const nodes = useEditorStore((state) => state.nodes); const edges = useEditorStore((state) => state.edges); const onNodesChange = useEditorStore((state) => state.onNodesChange); const onEdgesChange = useEditorStore((state) => state.onEdgesChange); const connect = useEditorStore((state) => state.connect); const addNode = useEditorStore((state) => state.addNode); const selectNode = useEditorStore((state) => state.selectNode); const deleteNodes = useEditorStore((state) => state.deleteNodes); const duplicateSelected = useEditorStore((state) => state.duplicateSelected); const undo = useEditorStore((state) => state.undo); const redo = useEditorStore((state) => state.redo); const { screenToFlowPosition } = useReactFlow();
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null; if (target?.matches("input, textarea, [contenteditable=true]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); notify(t("toast.duplicated")); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); const changed = event.shiftKey ? redo() : undo(); if (changed) notify(event.shiftKey ? t("toast.redo") : t("toast.undo")); }
    };
    window.addEventListener("keydown", handleKey); return () => window.removeEventListener("keydown", handleKey);
  }, [duplicateSelected, notify, redo, t, undo]);
  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const type = event.dataTransfer.getData("application/processcanvas") as WorkflowNodeType; if (!validTypes.has(type)) return; addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY })); notify(t("toast.added")); }, [addNode, notify, screenToFlowPosition, t]);
  const decoratedEdges = useMemo(() => edges.map((edge) => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: "#8793a6" }, labelStyle: { fontSize: 9, fontWeight: 700, fill: "#64748b" }, labelBgStyle: { fill: "var(--edge-label-bg, #fff)", fillOpacity: 0.96 }, labelBgPadding: [5, 3] as [number, number], labelBgBorderRadius: 5 })), [edges]);
  return <main className="canvas relative min-w-0 bg-canvas" onDrop={onDrop} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}><div className="canvas-hint pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-line bg-surface/95 px-3 py-2 text-[9px] font-semibold text-muted shadow-sm">{t("canvas.hint")}</div>{nodes.length === 0 && <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center"><div className="pointer-events-auto max-w-[320px] text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-brand shadow-sm"><Compass size={20} /></span><h2 className="mt-4 text-base font-bold text-ink">{t("canvas.emptyTitle")}</h2><p className="mt-1.5 text-[11px] leading-5 text-muted">{t("canvas.emptyText")}</p><button className="primary-button mx-auto mt-4" onClick={() => { addNode("start"); notify(t("toast.added")); }}>{t("canvas.addStart")}</button></div></div>}<ReactFlow nodes={nodes} edges={decoratedEdges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => selectNode(node.id)} onPaneClick={() => selectNode(null)} onNodesDelete={deleteNodes} deleteKeyCode={["Backspace", "Delete"]} fitView fitViewOptions={{ padding: 0.14, minZoom: 0.4 }} minZoom={0.25} maxZoom={1.8} defaultEdgeOptions={{ type: "smoothstep" }} connectionLineStyle={{ stroke: "rgb(var(--brand))", strokeWidth: 2 }} proOptions={{ hideAttribution: true }}><Background variant={BackgroundVariant.Dots} gap={21} size={1.1} color="rgb(var(--grid-dot))" /><Controls position="bottom-left" showInteractive={false} /><MiniMap position="bottom-right" pannable zoomable nodeStrokeWidth={2} maskColor="rgb(var(--minimap-mask))" nodeColor={(node) => miniMapColors[node.type ?? "task"] ?? miniMapColors.task} /></ReactFlow></main>;
}

function Workspace() {
  const { t } = useI18n(); const { notify } = useToast();
  const [showIntro, setShowIntro] = useState(false); const [showGuide, setShowGuide] = useState(false); const [showAbout, setShowAbout] = useState(false);
  const hydrated = useEditorStore((state) => state.hydrated); const introSeen = useEditorStore((state) => state.introSeen); const onboardingSeen = useEditorStore((state) => state.onboardingSeen); const setIntroSeen = useEditorStore((state) => state.setIntroSeen); const setOnboardingSeen = useEditorStore((state) => state.setOnboardingSeen); const resetWorkspace = useEditorStore((state) => state.resetWorkspace);
  const workflowName = useEditorStore((state) => state.workflowName); const nodes = useEditorStore((state) => state.nodes); const edges = useEditorStore((state) => state.edges); const locale = useEditorStore((state) => state.locale); const theme = useEditorStore((state) => state.theme); const isDemo = useEditorStore((state) => state.isDemo); const markSaving = useEditorStore((state) => state.markSaving); const markSaved = useEditorStore((state) => state.markSaved);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => { if (hydrated && !introSeen) setShowIntro(true); }, [hydrated, introSeen]);
  useEffect(() => { if (!hydrated) return; markSaving(); const timer = setTimeout(() => { saveWorkspace({ workflowName, nodes, edges, locale, theme, introSeen, onboardingSeen, isDemo }); markSaved(); }, 650); return () => clearTimeout(timer); }, [edges, hydrated, introSeen, isDemo, locale, markSaved, markSaving, nodes, onboardingSeen, theme, workflowName]);
  const finishIntro = useCallback(() => { setShowIntro(false); setIntroSeen(true); if (!onboardingSeen) setTimeout(() => setShowGuide(true), 180); }, [onboardingSeen, setIntroSeen]);
  const finishGuide = () => { setShowGuide(false); setOnboardingSeen(true); };
  const reset = () => { clearWorkspace(); resetWorkspace(); setShowAbout(false); setShowIntro(true); notify(t("toast.reset")); };
  if (!hydrated) return <div className="h-dvh bg-canvas" />;
  return <div className="flex h-dvh min-w-[760px] flex-col overflow-hidden bg-canvas"><TopBar onGuide={() => setShowGuide(true)} onAbout={() => setShowAbout(true)} /><div className="editor-shell grid min-h-0 flex-1 grid-cols-[220px_minmax(480px,1fr)_292px]"><NodePalette /><ReactFlowProvider><EditorCanvas /></ReactFlowProvider><PropertiesPanel /></div>{showIntro && <IntroScreen onFinish={finishIntro} />}{showGuide && <Onboarding onFinish={finishGuide} />}{showAbout && <AboutModal onClose={() => setShowAbout(false)} onReplayIntro={() => { setShowAbout(false); setShowIntro(true); }} onReset={reset} />}</div>;
}

export function WorkflowEditor() {
  const locale = useEditorStore((state) => state.locale); const setLocale = useEditorStore((state) => state.setLocale); const hydrate = useEditorStore((state) => state.hydrate);
  useEffect(() => { hydrate(loadWorkspace()); }, [hydrate]);
  return <I18nProvider locale={locale} setLocale={setLocale}><ToastProvider><Workspace /></ToastProvider></I18nProvider>;
}
