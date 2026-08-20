"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
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
import { HelpCenter } from "@/components/experience/help-center";
import { TutorialOverlay } from "@/components/experience/tutorial-overlay";
import { SimulationModal } from "@/components/experience/simulation-modal";
import { AccountProvider, useAccount } from "@/components/account/account-provider";
import { AuthModal } from "@/components/account/auth-modal";
import { ProcessLibrary } from "@/components/account/process-library";
import { VersionHistory } from "@/components/account/version-history";
import { MigrationPrompt } from "@/components/account/migration-prompt";
import { api, ApiClientError } from "@/lib/api-client";
import { clearServerDraft, loadServerDraft, saveServerDraft } from "@/lib/server-draft";
import { TopBar } from "./top-bar";
import { NodePalette } from "./node-palette";
import { PropertiesPanel } from "./properties-panel";

const nodeTypes: NodeTypes = { start: StartNode, task: TaskNode, approval: ApprovalNode, condition: ConditionNode, end: EndNode };
const validTypes = new Set<WorkflowNodeType>(["start", "task", "approval", "condition", "end"]);
const miniMapColors: Record<string, string> = { start: "#22a06b", task: "#3975d3", approval: "#7856c8", condition: "#d48a19", end: "#68758a" };

function EditorCanvas() {
  const { t } = useI18n();
  const { notify } = useToast();
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const connect = useEditorStore((state) => state.connect);
  const addNode = useEditorStore((state) => state.addNode);
  const selectNode = useEditorStore((state) => state.selectNode);
  const deleteNodes = useEditorStore((state) => state.deleteNodes);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable=true]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); notify(t("toast.duplicated")); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); const changed = event.shiftKey ? redo() : undo(); if (changed) notify(event.shiftKey ? t("toast.redo") : t("toast.undo")); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [duplicateSelected, notify, redo, t, undo]);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/processcanvas") as WorkflowNodeType;
    if (!validTypes.has(type)) return;
    addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    notify(t("toast.added"));
  }, [addNode, notify, screenToFlowPosition, t]);
  const decoratedEdges = useMemo(() => edges.map((edge) => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: "#8793a6" }, labelStyle: { fontSize: 9, fontWeight: 700, fill: "#64748b" }, labelBgStyle: { fill: "var(--edge-label-bg, #fff)", fillOpacity: 0.96 }, labelBgPadding: [5, 3] as [number, number], labelBgBorderRadius: 5 })), [edges]);

  return <main data-tutorial-target="canvas" className="canvas relative min-w-0 bg-canvas" onDrop={onDrop} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}>
    <div className="canvas-hint pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-line bg-surface/95 px-3 py-2 text-[9px] font-semibold text-muted shadow-sm">{t("canvas.hint")}</div>
    {nodes.length === 0 && <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center"><div className="pointer-events-auto max-w-[320px] text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-brand shadow-sm"><Compass size={20} /></span><h2 className="mt-4 text-base font-bold text-ink">{t("canvas.emptyTitle")}</h2><p className="mt-1.5 text-[11px] leading-5 text-muted">{t("canvas.emptyText")}</p><button className="primary-button mx-auto mt-4" onClick={() => { addNode("start"); notify(t("toast.added")); }}>{t("canvas.addStart")}</button></div></div>}
    <ReactFlow nodes={nodes} edges={decoratedEdges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => selectNode(node.id)} onPaneClick={() => selectNode(null)} onNodesDelete={deleteNodes} deleteKeyCode={["Backspace", "Delete"]} fitView fitViewOptions={{ padding: 0.14, minZoom: 0.4 }} minZoom={0.25} maxZoom={1.8} defaultEdgeOptions={{ type: "smoothstep" }} connectionLineStyle={{ stroke: "rgb(var(--brand))", strokeWidth: 2 }} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={21} size={1.1} color="rgb(var(--grid-dot))" /><Controls position="bottom-left" showInteractive={false} /><MiniMap position="bottom-right" pannable zoomable nodeStrokeWidth={2} maskColor="rgb(var(--minimap-mask))" nodeColor={(node) => miniMapColors[node.type ?? "task"] ?? miniMapColors.task} />
    </ReactFlow>
  </main>;
}

function Workspace() {
  const { t } = useI18n();
  const { notify } = useToast();
  const account = useAccount();
  const accountSession = account.session;
  const serverSnapshot = useRef<{ id: string | null; fingerprint: string }>({ id: null, fingerprint: "" });
  const [showIntro, setShowIntro] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const hydrated = useEditorStore((state) => state.hydrated);
  const introSeen = useEditorStore((state) => state.introSeen);
  const tutorialSeen = useEditorStore((state) => state.tutorialSeen);
  const tutorialActive = useEditorStore((state) => state.tutorialActive);
  const setIntroSeen = useEditorStore((state) => state.setIntroSeen);
  const setOnboardingSeen = useEditorStore((state) => state.setOnboardingSeen);
  const startTutorial = useEditorStore((state) => state.startTutorial);
  const markTutorialEvent = useEditorStore((state) => state.markTutorialEvent);
  const resetWorkspace = useEditorStore((state) => state.resetWorkspace);
  const restoreDemo = useEditorStore((state) => state.restoreDemo);
  const workflowName = useEditorStore((state) => state.workflowName);
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const locale = useEditorStore((state) => state.locale);
  const theme = useEditorStore((state) => state.theme);
  const onboardingSeen = useEditorStore((state) => state.onboardingSeen);
  const tutorialCompleted = useEditorStore((state) => state.tutorialCompleted);
  const tutorialStep = useEditorStore((state) => state.tutorialStep);
  const tutorialEvents = useEditorStore((state) => state.tutorialEvents);
  const tutorialBackup = useEditorStore((state) => state.tutorialBackup);
  const isDemo = useEditorStore((state) => state.isDemo);
  const markSaving = useEditorStore((state) => state.markSaving);
  const markSaved = useEditorStore((state) => state.markSaved);
  const markSaveError = useEditorStore((state) => state.markSaveError);
  const currentProcessId = useEditorStore((state) => state.currentProcessId);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => { if (hydrated && !introSeen) setShowIntro(true); }, [hydrated, introSeen]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      saveWorkspace({ workflowName, nodes, edges, locale, theme, introSeen, onboardingSeen, isDemo, tutorialSeen, tutorialCompleted, tutorialActive, tutorialStep, tutorialEvents, tutorialBackup });
      if (!currentProcessId) markSaved();
      if (tutorialActive && tutorialStep === 7 && !tutorialEvents.autosave) markTutorialEvent("autosave");
    }, 650);
    return () => clearTimeout(timer);
  }, [currentProcessId, edges, hydrated, introSeen, isDemo, locale, markSaved, markTutorialEvent, nodes, onboardingSeen, theme, tutorialActive, tutorialBackup, tutorialCompleted, tutorialEvents, tutorialSeen, tutorialStep, workflowName]);

  useEffect(() => {
    if (!hydrated || !accountSession || !currentProcessId || tutorialActive) return;
    const fingerprint = JSON.stringify([workflowName, nodes, edges]);
    if (serverSnapshot.current.id !== currentProcessId) { serverSnapshot.current = { id: currentProcessId, fingerprint }; return; }
    if (serverSnapshot.current.fingerprint === fingerprint) return;
    markSaving();
    const timer = window.setTimeout(async () => {
      const state = useEditorStore.getState();
      if (!state.currentProcessId || !state.currentServerVersion) return;
      try {
        const result = await api.updateProcess(state.currentProcessId, { name: state.workflowName, nodes: state.nodes, edges: state.edges, expectedVersion: state.currentServerVersion });
        state.setServerVersion(result.process.currentVersion); serverSnapshot.current = { id: state.currentProcessId, fingerprint }; clearServerDraft();
      } catch (error) {
        if (error instanceof ApiClientError && (error.code === "network_error" || error.code === "timeout" || error.status >= 500)) { saveServerDraft({ processId: state.currentProcessId, expectedVersion: state.currentServerVersion, name: state.workflowName, nodes: state.nodes, edges: state.edges }); state.markSaveError(true); }
        else { state.markSaveError(false); }
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [accountSession, currentProcessId, edges, hydrated, markSaving, nodes, tutorialActive, workflowName]);

  useEffect(() => {
    const retry = async () => { const draft = loadServerDraft(); if (!draft || draft.processId !== useEditorStore.getState().currentProcessId) return; try { const result = await api.updateProcess(draft.processId, { name: draft.name, nodes: draft.nodes, edges: draft.edges, expectedVersion: draft.expectedVersion }); useEditorStore.getState().setServerVersion(result.process.currentVersion); clearServerDraft(); } catch { markSaveError(true); } };
    window.addEventListener("online", retry);
    if (navigator.onLine) void retry();
    const timer = window.setInterval(() => { if (navigator.onLine && loadServerDraft()) void retry(); }, 5000);
    return () => { window.removeEventListener("online", retry); window.clearInterval(timer); };
  }, [currentProcessId, markSaveError]);

  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { const status = useEditorStore.getState().saveStatus; if (status === "saving" || status === "error" || status === "offline") event.preventDefault(); }; window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload); }, []);

  const finishIntro = useCallback(() => { setShowIntro(false); setIntroSeen(true); if (!tutorialSeen) setTimeout(() => setShowWelcome(true), 180); }, [setIntroSeen, tutorialSeen]);
  const skipWelcome = () => { setShowWelcome(false); setOnboardingSeen(true); useEditorStore.setState({ tutorialSeen: true }); };
  const beginTutorial = () => { setShowWelcome(false); setShowHelp(false); setOnboardingSeen(true); startTutorial(); };
  const reset = () => { clearWorkspace(); resetWorkspace(); setShowAbout(false); setShowIntro(true); notify(t("toast.reset")); };
  if (!hydrated) return <div className="h-dvh bg-canvas" />;
  return <div className="flex h-dvh min-w-[760px] flex-col overflow-hidden bg-canvas">
    <TopBar onGuide={() => setShowHelp(true)} onAbout={() => setShowAbout(true)} onRun={() => setShowRun(true)} onAuth={() => setShowAuth(true)} onProcesses={() => { void account.refreshProcesses(); setShowLibrary(true); }} onVersions={() => setShowVersions(true)} />
    <div className="editor-shell grid min-h-0 flex-1 grid-cols-[220px_minmax(480px,1fr)_292px]"><NodePalette /><ReactFlowProvider><EditorCanvas /></ReactFlowProvider><PropertiesPanel /></div>
    {showIntro && <IntroScreen onFinish={finishIntro} />}
    {showWelcome && <Onboarding onStart={beginTutorial} onSkip={skipWelcome} />}
    {tutorialActive && <TutorialOverlay />}
    {showHelp && <HelpCenter onClose={() => setShowHelp(false)} onTutorial={beginTutorial} onDemo={() => { restoreDemo(); setShowHelp(false); notify(t("toast.demo")); }} />}
    {showAbout && <AboutModal onClose={() => setShowAbout(false)} onReplayIntro={() => { setShowAbout(false); setShowIntro(true); }} onReset={reset} />}
    {showRun && <SimulationModal onClose={() => setShowRun(false)} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    {showLibrary && <ProcessLibrary onClose={() => setShowLibrary(false)} />}
    {showVersions && <VersionHistory onClose={() => setShowVersions(false)} />}
    {account.migrationNeeded && <MigrationPrompt onOpenLibrary={() => setShowLibrary(true)} />}
  </div>;
}

export function WorkflowEditor() {
  const locale = useEditorStore((state) => state.locale);
  const setLocale = useEditorStore((state) => state.setLocale);
  const hydrate = useEditorStore((state) => state.hydrate);
  useEffect(() => { hydrate(loadWorkspace()); }, [hydrate]);
  return <I18nProvider locale={locale} setLocale={setLocale}><AccountProvider><ToastProvider><Workspace /></ToastProvider></AccountProvider></I18nProvider>;
}
