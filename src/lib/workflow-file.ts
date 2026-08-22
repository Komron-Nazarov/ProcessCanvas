import type { WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from "@/types/workflow";

export const WORKFLOW_FILE_VERSION = 1;
export const MAX_WORKFLOW_FILE_BYTES = 1024 * 1024;

export type WorkflowFile = {
  format: "processcanvas";
  version: typeof WORKFLOW_FILE_VERSION;
  exportedAt: string;
  workflow: { name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };
};

export type WorkflowFileError = "too_large" | "invalid_json" | "unsupported_version" | "invalid_structure";

const nodeTypes = new Set<WorkflowNodeType>(["start", "task", "approval", "condition", "end"]);
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;

function parseNode(value: unknown): WorkflowNode | null {
  if (!object(value) || !text(value.id, 160) || !nodeTypes.has(value.type as WorkflowNodeType) || !object(value.position) || typeof value.position.x !== "number" || typeof value.position.y !== "number" || !Number.isFinite(value.position.x) || !Number.isFinite(value.position.y) || !object(value.data)) return null;
  const data = value.data;
  if (!text(data.label, 240) || !text(data.description, 4000) || !text(data.assignee, 240) || !text(data.duration, 120)) return null;
  return { id: value.id, type: value.type as WorkflowNodeType, position: { x: value.position.x, y: value.position.y }, data: { label: data.label, description: data.description, assignee: data.assignee, duration: data.duration } satisfies WorkflowNodeData };
}

function parseEdge(value: unknown): WorkflowEdge | null {
  if (!object(value) || !text(value.id, 160) || !text(value.source, 160) || !text(value.target, 160)) return null;
  if (value.sourceHandle !== undefined && value.sourceHandle !== null && !text(value.sourceHandle, 80)) return null;
  if (value.targetHandle !== undefined && value.targetHandle !== null && !text(value.targetHandle, 80)) return null;
  if (value.label !== undefined && typeof value.label !== "string" && typeof value.label !== "number") return null;
  return { id: value.id, source: value.source, target: value.target, sourceHandle: value.sourceHandle as string | null | undefined, targetHandle: value.targetHandle as string | null | undefined, label: value.label as string | number | undefined, type: "smoothstep" };
}

export function createWorkflowFile(name: string, nodes: WorkflowNode[], edges: WorkflowEdge[], exportedAt = new Date().toISOString()): WorkflowFile {
  return { format: "processcanvas", version: WORKFLOW_FILE_VERSION, exportedAt, workflow: { name, nodes: nodes.map((node) => ({ ...node, position: { ...node.position }, data: { ...node.data }, selected: undefined })), edges: edges.map((edge) => ({ ...edge, selected: undefined })) } };
}

export function serializeWorkflowFile(name: string, nodes: WorkflowNode[], edges: WorkflowEdge[], exportedAt?: string) {
  return JSON.stringify(createWorkflowFile(name, nodes, edges, exportedAt), null, 2);
}

export function parseWorkflowFile(source: string): { ok: true; value: WorkflowFile } | { ok: false; error: WorkflowFileError } {
  let value: unknown;
  try { value = JSON.parse(source); } catch { return { ok: false, error: "invalid_json" }; }
  if (!object(value) || value.format !== "processcanvas") return { ok: false, error: "invalid_structure" };
  if (value.version !== WORKFLOW_FILE_VERSION) return { ok: false, error: "unsupported_version" };
  if (!text(value.exportedAt, 80) || !object(value.workflow) || !text(value.workflow.name, 240) || !Array.isArray(value.workflow.nodes) || !Array.isArray(value.workflow.edges) || value.workflow.nodes.length > 500 || value.workflow.edges.length > 1000) return { ok: false, error: "invalid_structure" };
  const nodes = value.workflow.nodes.map(parseNode); const edges = value.workflow.edges.map(parseEdge);
  if (nodes.some((node) => !node) || edges.some((edge) => !edge)) return { ok: false, error: "invalid_structure" };
  const safeNodes = nodes as WorkflowNode[]; const ids = new Set(safeNodes.map((node) => node.id));
  if (ids.size !== safeNodes.length || (edges as WorkflowEdge[]).some((edge) => !ids.has(edge.source) || !ids.has(edge.target))) return { ok: false, error: "invalid_structure" };
  return { ok: true, value: { format: "processcanvas", version: WORKFLOW_FILE_VERSION, exportedAt: value.exportedAt, workflow: { name: value.workflow.name, nodes: safeNodes, edges: edges as WorkflowEdge[] } } };
}

export function workflowFilename(name: string) {
  const slug = name.trim().toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "workflow";
  return `${slug}.processcanvas.json`;
}
