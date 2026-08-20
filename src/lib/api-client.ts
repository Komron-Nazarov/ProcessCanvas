import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type ApiUser = { id: string; name: string; email: string };
export type ApiWorkspace = { id: string; name: string; role: "owner" | "editor" | "viewer" };
export type ApiSession = { user: ApiUser; workspace: ApiWorkspace };
export type ApiProcess = { id: string; workspaceId: string; name: string; status: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; currentVersion: number; createdAt: string; updatedAt: string };
export type ApiProcessSummary = Pick<ApiProcess, "id" | "name" | "status" | "currentVersion" | "createdAt" | "updatedAt">;
export type ApiVersion = { id: string; processId: string; version: number; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; createdBy: string; authorName: string; createdAt: string };

type ApiErrorBody = { error?: { code?: string; message?: string; fields?: Record<string, string> }; process?: ApiProcess };
export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>, public process?: ApiProcess) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(path, { ...init, credentials: "include", signal: controller.signal, headers: { "Content-Type": "application/json", ...init?.headers } });
    const body = await response.json().catch(() => ({})) as ApiErrorBody & T;
    if (!response.ok) throw new ApiClientError(response.status, body.error?.code ?? "request_failed", body.error?.message ?? "Request failed", body.error?.fields, body.process);
    return body;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError(0, error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network_error", "The server is unavailable");
  } finally { window.clearTimeout(timeout); }
}

export const api = {
  session: () => request<ApiSession>("/api/auth/session"),
  register: (input: { name: string; email: string; password: string }) => request<ApiSession>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<ApiSession>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  listProcesses: (workspaceId: string) => request<{ processes: ApiProcessSummary[] }>(`/api/processes?workspaceId=${encodeURIComponent(workspaceId)}`),
  getProcess: (id: string) => request<{ process: ApiProcess }>(`/api/processes/${encodeURIComponent(id)}`),
  createProcess: (input: { workspaceId: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => request<{ process: ApiProcess }>("/api/processes", { method: "POST", body: JSON.stringify(input) }),
  updateProcess: (id: string, input: { name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; expectedVersion: number }) => request<{ process: ApiProcess }>(`/api/processes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProcess: (id: string) => request<{ ok: boolean }>(`/api/processes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  versions: (id: string) => request<{ versions: ApiVersion[] }>(`/api/processes/${encodeURIComponent(id)}/versions`),
  checkpoint: (id: string) => request<{ version: ApiVersion }>(`/api/processes/${encodeURIComponent(id)}/versions`, { method: "POST" }),
  restoreVersion: (id: string, version: number) => request<{ process: ApiProcess }>(`/api/processes/${encodeURIComponent(id)}/versions/${version}/restore`, { method: "POST" }),
};
