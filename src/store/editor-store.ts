import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import { createDemoWorkflow, getNodeDefaults } from "@/data/demo-workflow";
import type { Locale } from "@/i18n/types";
import type { PersistedWorkspace } from "@/lib/persistence";
import type { WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from "@/types/workflow";

type EditorSnapshot = { workflowName: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; isDemo: boolean };
type SaveStatus = "saved" | "saving";

type EditorState = {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  locale: Locale;
  theme: "light" | "dark";
  introSeen: boolean;
  onboardingSeen: boolean;
  isDemo: boolean;
  hydrated: boolean;
  saveStatus: SaveStatus;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  dragHistoryCaptured: boolean;
  lastEditKey: string | null;
  lastEditAt: number;
  setWorkflowName: (name: string) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  connect: (connection: Connection) => void;
  addNode: (type: WorkflowNodeType, position?: XYPosition) => void;
  selectNode: (id: string | null) => void;
  updateNode: (id: string, data: Partial<WorkflowNodeData>) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  deleteNodes: (nodes: WorkflowNode[]) => void;
  clearWorkflow: () => void;
  restoreDemo: () => void;
  undo: () => boolean;
  redo: () => boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: "light" | "dark") => void;
  setIntroSeen: (seen: boolean) => void;
  setOnboardingSeen: (seen: boolean) => void;
  hydrate: (workspace: PersistedWorkspace | null) => void;
  markSaving: () => void;
  markSaved: () => void;
  resetWorkspace: () => void;
};

const HISTORY_LIMIT = 50;
const TEXT_GROUP_MS = 750;
const initialDemo = createDemoWorkflow("ru");
const uniqueId = (type: WorkflowNodeType) => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const cloneNodes = (nodes: WorkflowNode[]) => nodes.map((node) => ({ ...node, data: { ...node.data }, position: { ...node.position } }));
const cloneEdges = (edges: WorkflowEdge[]) => edges.map((edge) => ({ ...edge }));
const capture = (state: Pick<EditorState, "workflowName" | "nodes" | "edges" | "isDemo">): EditorSnapshot => ({
  workflowName: state.workflowName,
  nodes: cloneNodes(state.nodes),
  edges: cloneEdges(state.edges),
  isDemo: state.isDemo,
});
const history = (state: EditorState) => ({ past: [...state.past, capture(state)].slice(-HISTORY_LIMIT), future: [] as EditorSnapshot[] });

export const useEditorStore = create<EditorState>((set, get) => ({
  workflowName: initialDemo.name,
  nodes: initialDemo.nodes,
  edges: initialDemo.edges,
  selectedNodeId: null,
  locale: "ru",
  theme: "light",
  introSeen: false,
  onboardingSeen: false,
  isDemo: true,
  hydrated: false,
  saveStatus: "saved",
  past: [],
  future: [],
  dragHistoryCaptured: false,
  lastEditKey: null,
  lastEditAt: 0,

  setWorkflowName: (workflowName) => set((state) => {
    const now = Date.now();
    const shouldCapture = state.lastEditKey !== "workflow-name" || now - state.lastEditAt > TEXT_GROUP_MS;
    return { ...(shouldCapture ? history(state) : {}), workflowName, isDemo: false, lastEditKey: "workflow-name", lastEditAt: now };
  }),
  onNodesChange: (changes) => set((state) => {
    const structural = changes.some((change) => change.type === "remove" || change.type === "add" || change.type === "replace");
    const moving = changes.some((change) => change.type === "position" && change.position);
    const shouldCaptureMove = moving && !state.dragHistoryCaptured;
    const finishedMoving = changes.some((change) => change.type === "position" && change.dragging === false);
    return {
      ...(structural || shouldCaptureMove ? history(state) : {}),
      nodes: applyNodeChanges(changes, state.nodes),
      isDemo: structural || moving ? false : state.isDemo,
      dragHistoryCaptured: finishedMoving ? false : (moving ? true : state.dragHistoryCaptured),
      lastEditKey: null,
    };
  }),
  onEdgesChange: (changes) => set((state) => {
    const structural = changes.some((change) => change.type === "remove" || change.type === "add" || change.type === "replace");
    return { ...(structural ? history(state) : {}), edges: applyEdgeChanges(changes, state.edges), isDemo: structural ? false : state.isDemo, lastEditKey: null };
  }),
  connect: (connection) => set((state) => ({
    ...history(state),
    edges: addEdge({ ...connection, id: `edge-${Date.now()}`, type: "smoothstep" }, state.edges),
    isDemo: false,
    lastEditKey: null,
  })),
  addNode: (type, position) => {
    const state = get();
    const count = state.nodes.length;
    const node: WorkflowNode = {
      id: uniqueId(type),
      type,
      position: position ?? { x: 160 + (count % 4) * 245, y: 120 + Math.floor(count / 4) * 150 },
      data: getNodeDefaults(state.locale, type),
      selected: true,
    };
    set({
      ...history(state),
      nodes: [...state.nodes.map((item) => ({ ...item, selected: false })), node],
      selectedNodeId: node.id,
      isDemo: false,
      lastEditKey: null,
    });
  },
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  updateNode: (id, data) => set((state) => {
    const field = Object.keys(data)[0] ?? "data";
    const editKey = `${id}:${field}`;
    const now = Date.now();
    const shouldCapture = state.lastEditKey !== editKey || now - state.lastEditAt > TEXT_GROUP_MS;
    return {
      ...(shouldCapture ? history(state) : {}),
      nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...data } } : node),
      isDemo: false,
      lastEditKey: editKey,
      lastEditAt: now,
    };
  }),
  duplicateSelected: () => {
    const state = get();
    const source = state.nodes.find((node) => node.id === state.selectedNodeId);
    if (!source) return;
    const copy: WorkflowNode = {
      ...source,
      id: uniqueId(source.type),
      position: { x: source.position.x + 36, y: source.position.y + 36 },
      data: { ...source.data, label: state.locale === "ru" ? `${source.data.label} — копия` : `${source.data.label} copy` },
      selected: true,
    };
    set({ ...history(state), nodes: [...state.nodes.map((node) => ({ ...node, selected: false })), copy], selectedNodeId: copy.id, isDemo: false, lastEditKey: null });
  },
  deleteSelected: () => set((state) => {
    if (!state.selectedNodeId) return state;
    return {
      ...history(state),
      nodes: state.nodes.filter((node) => node.id !== state.selectedNodeId),
      edges: state.edges.filter((edge) => edge.source !== state.selectedNodeId && edge.target !== state.selectedNodeId),
      selectedNodeId: null,
      isDemo: false,
      lastEditKey: null,
    };
  }),
  deleteNodes: (deleted) => set((state) => ({ selectedNodeId: deleted.some((node) => node.id === state.selectedNodeId) ? null : state.selectedNodeId })),
  clearWorkflow: () => set((state) => ({ ...history(state), workflowName: state.locale === "ru" ? "Новый процесс" : "New workflow", nodes: [], edges: [], selectedNodeId: null, isDemo: false, lastEditKey: null })),
  restoreDemo: () => set((state) => {
    const demo = createDemoWorkflow(state.locale);
    return { ...history(state), workflowName: demo.name, nodes: demo.nodes, edges: demo.edges, selectedNodeId: null, isDemo: true, lastEditKey: null };
  }),
  undo: () => {
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return false;
    set({ ...previous, nodes: cloneNodes(previous.nodes), edges: cloneEdges(previous.edges), selectedNodeId: null, past: state.past.slice(0, -1), future: [capture(state), ...state.future].slice(0, HISTORY_LIMIT), lastEditKey: null });
    return true;
  },
  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return false;
    set({ ...next, nodes: cloneNodes(next.nodes), edges: cloneEdges(next.edges), selectedNodeId: null, past: [...state.past, capture(state)].slice(-HISTORY_LIMIT), future: state.future.slice(1), lastEditKey: null });
    return true;
  },
  setLocale: (locale) => set((state) => {
    if (!state.isDemo) return { locale };
    const demo = createDemoWorkflow(locale);
    return { locale, workflowName: demo.name, nodes: demo.nodes, edges: demo.edges, past: [], future: [] };
  }),
  setTheme: (theme) => set({ theme }),
  setIntroSeen: (introSeen) => set({ introSeen }),
  setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),
  hydrate: (workspace) => set(() => workspace ? {
    workflowName: workspace.workflowName,
    nodes: workspace.nodes,
    edges: workspace.edges,
    locale: workspace.locale,
    theme: workspace.theme,
    introSeen: workspace.introSeen,
    onboardingSeen: workspace.onboardingSeen,
    isDemo: workspace.isDemo,
    hydrated: true,
    past: [],
    future: [],
  } : { hydrated: true }),
  markSaving: () => set({ saveStatus: "saving" }),
  markSaved: () => set({ saveStatus: "saved" }),
  resetWorkspace: () => {
    const demo = createDemoWorkflow("ru");
    set({ workflowName: demo.name, nodes: demo.nodes, edges: demo.edges, selectedNodeId: null, locale: "ru", theme: "light", introSeen: false, onboardingSeen: false, isDemo: true, hydrated: true, saveStatus: "saved", past: [], future: [], lastEditKey: null });
  },
}));
