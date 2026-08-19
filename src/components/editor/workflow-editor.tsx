"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { useEditorStore } from "@/store/editor-store";
import type { WorkflowNodeType } from "@/types/workflow";
import { StartNode } from "@/components/nodes/start-node";
import { TaskNode } from "@/components/nodes/task-node";
import { ApprovalNode } from "@/components/nodes/approval-node";
import { ConditionNode } from "@/components/nodes/condition-node";
import { EndNode } from "@/components/nodes/end-node";
import { TopBar } from "./top-bar";
import { NodePalette } from "./node-palette";
import { PropertiesPanel } from "./properties-panel";

const nodeTypes: NodeTypes = { start: StartNode, task: TaskNode, approval: ApprovalNode, condition: ConditionNode, end: EndNode };
const validTypes = new Set<WorkflowNodeType>(["start", "task", "approval", "condition", "end"]);
const miniMapColors: Record<string, string> = { start: "#34d399", task: "#60a5fa", approval: "#a78bfa", condition: "#fbbf24", end: "#94a3b8" };

function EditorCanvas() {
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const connect = useEditorStore((state) => state.connect);
  const addNode = useEditorStore((state) => state.addNode);
  const selectNode = useEditorStore((state) => state.selectNode);
  const deleteNodes = useEditorStore((state) => state.deleteNodes);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable=true]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [duplicateSelected]);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/processcanvas") as WorkflowNodeType;
    if (!validTypes.has(type)) return;
    addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [addNode, screenToFlowPosition]);

  const decoratedEdges = useMemo(() => edges.map((edge) => ({
    ...edge,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#94a3b8" },
    labelStyle: { fontSize: 10, fontWeight: 600, fill: "#64748b" },
    labelBgStyle: { fill: "var(--edge-label-bg, #fff)", fillOpacity: 0.9 },
    labelBgPadding: [5, 3] as [number, number],
    labelBgBorderRadius: 5,
  })), [edges]);

  return (
    <main className="relative min-w-0 bg-canvas" onDrop={onDrop} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}>
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-line bg-surface/90 px-3 py-2 text-[10px] font-medium text-muted shadow-sm backdrop-blur">Drag canvas to pan · Scroll to zoom</div>
      <ReactFlow
        nodes={nodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onNodesDelete={deleteNodes}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        fitViewOptions={{ padding: 0.14, minZoom: 0.4 }}
        minZoom={0.25}
        maxZoom={1.8}
        defaultEdgeOptions={{ type: "smoothstep" }}
        connectionLineStyle={{ stroke: "#6474d9", strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap position="bottom-right" pannable zoomable nodeStrokeWidth={2} maskColor="rgb(15 23 42 / 0.08)" nodeColor={(node) => miniMapColors[node.type ?? "task"] ?? miniMapColors.task} />
      </ReactFlow>
    </main>
  );
}

export function WorkflowEditor() {
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return (
    <div className="flex h-dvh min-w-[760px] flex-col overflow-hidden bg-canvas">
      <TopBar dark={dark} onToggleTheme={() => setDark((value) => !value)} />
      <div className="editor-shell grid min-h-0 flex-1 grid-cols-[220px_minmax(520px,1fr)_280px]">
        <NodePalette />
        <ReactFlowProvider><EditorCanvas /></ReactFlowProvider>
        <PropertiesPanel />
      </div>
    </div>
  );
}
