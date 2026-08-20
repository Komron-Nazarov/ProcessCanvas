import type { Locale } from "@/i18n/types";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const STORAGE_KEY = "processcanvas:workspace";
export const STORAGE_VERSION = 2;

export type PersistedWorkspace = {
  version: number;
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  locale: Locale;
  theme: "light" | "dark";
  introSeen: boolean;
  onboardingSeen: boolean;
  isDemo: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadWorkspace(): PersistedWorkspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== STORAGE_VERSION) return null;
    if (typeof value.workflowName !== "string" || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return null;
    if (value.locale !== "ru" && value.locale !== "en") return null;
    if (value.theme !== "light" && value.theme !== "dark") return null;
    if (typeof value.introSeen !== "boolean" || typeof value.onboardingSeen !== "boolean" || typeof value.isDemo !== "boolean") return null;
    return value as PersistedWorkspace;
  } catch {
    return null;
  }
}

export function saveWorkspace(value: Omit<PersistedWorkspace, "version">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...value }));
}

export function clearWorkspace() {
  localStorage.removeItem(STORAGE_KEY);
}
