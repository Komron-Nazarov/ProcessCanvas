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
import { demoWorkflow } from "@/data/demo-workflow";
import { NODE_DEFAULTS, type WorkflowEdge, type WorkflowNode, type WorkflowNodeData, type WorkflowNodeType } from "@/types/workflow";

type EditorState = {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
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
};

const uniqueId = (type: WorkflowNodeType) => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  workflowName: demoWorkflow.name,
  nodes: demoWorkflow.nodes,
  edges: demoWorkflow.edges,
  selectedNodeId: null,
  setWorkflowName: (workflowName) => set({ workflowName }),
  onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  connect: (connection) => set((state) => ({
    edges: addEdge({ ...connection, id: `edge-${Date.now()}`, type: "smoothstep" }, state.edges),
  })),
  addNode: (type, position) => {
    const count = get().nodes.length;
    const node: WorkflowNode = {
      id: uniqueId(type),
      type,
      position: position ?? { x: 180 + (count % 4) * 230, y: 120 + Math.floor(count / 4) * 150 },
      data: { ...NODE_DEFAULTS[type] },
      selected: true,
    };
    set((state) => ({
      nodes: [...state.nodes.map((item) => ({ ...item, selected: false })), node],
      selectedNodeId: node.id,
    }));
  },
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...data } } : node),
  })),
  duplicateSelected: () => {
    const source = get().nodes.find((node) => node.id === get().selectedNodeId);
    if (!source) return;
    const copy: WorkflowNode = {
      ...source,
      id: uniqueId(source.type),
      position: { x: source.position.x + 36, y: source.position.y + 36 },
      data: { ...source.data, label: `${source.data.label} copy` },
      selected: true,
    };
    set((state) => ({
      nodes: [...state.nodes.map((node) => ({ ...node, selected: false })), copy],
      selectedNodeId: copy.id,
    }));
  },
  deleteSelected: () => set((state) => {
    if (!state.selectedNodeId) return state;
    return {
      nodes: state.nodes.filter((node) => node.id !== state.selectedNodeId),
      edges: state.edges.filter((edge) => edge.source !== state.selectedNodeId && edge.target !== state.selectedNodeId),
      selectedNodeId: null,
    };
  }),
  deleteNodes: (deleted) => set((state) => ({
    selectedNodeId: deleted.some((node) => node.id === state.selectedNodeId) ? null : state.selectedNodeId,
  })),
}));
