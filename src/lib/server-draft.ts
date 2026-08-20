import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

const DRAFT_KEY = "processcanvas:server-draft";
const DRAFT_VERSION = 1;
export type ServerDraft = { version: number; processId: string; expectedVersion: number; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; savedAt: string };

export function saveServerDraft(value: Omit<ServerDraft, "version" | "savedAt">) { localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: DRAFT_VERSION, savedAt: new Date().toISOString(), ...value })); }
export function loadServerDraft(): ServerDraft | null { try { const value: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"); if (!value || typeof value !== "object") return null; const draft = value as Partial<ServerDraft>; if (draft.version !== DRAFT_VERSION || typeof draft.processId !== "string" || typeof draft.expectedVersion !== "number" || typeof draft.name !== "string" || !Array.isArray(draft.nodes) || !Array.isArray(draft.edges) || typeof draft.savedAt !== "string") return null; return draft as ServerDraft; } catch { return null; } }
export function clearServerDraft() { localStorage.removeItem(DRAFT_KEY); }
