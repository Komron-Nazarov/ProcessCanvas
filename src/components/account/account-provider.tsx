"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiClientError, type ApiProcess, type ApiProcessSummary, type ApiSession, type ApiVersion } from "@/lib/api-client";
import { useEditorStore } from "@/store/editor-store";

const CURRENT_PROCESS_KEY = "processcanvas:current-server-process";
type AccountContextValue = {
  session: ApiSession | null; loading: boolean; processes: ApiProcessSummary[]; processesLoading: boolean; error: string | null; migrationNeeded: boolean;
  login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => Promise<void>;
  refreshProcesses: () => Promise<void>; createProcess: (useCurrent?: boolean) => Promise<ApiProcess>; openProcess: (id: string) => Promise<void>; renameProcess: (id: string, name: string) => Promise<void>; deleteProcess: (id: string) => Promise<void>;
  saveCurrent: () => Promise<ApiProcess | null>; checkpoint: () => Promise<ApiVersion | null>; listVersions: () => Promise<ApiVersion[]>; restoreVersion: (version: number) => Promise<void>;
  migrateLocal: () => Promise<void>; dismissMigration: () => void;
};
const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ApiSession | null>(null); const [loading, setLoading] = useState(true); const [processes, setProcesses] = useState<ApiProcessSummary[]>([]); const [processesLoading, setProcessesLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [migrationNeeded, setMigrationNeeded] = useState(false);
  const loadServerProcess = useEditorStore((state) => state.loadServerProcess); const clearServerBinding = useEditorStore((state) => state.clearServerBinding);

  const refreshProcesses = useCallback(async (active = session) => { if (!active) { setProcesses([]); return; } setProcessesLoading(true); try { const result = await api.listProcesses(active.workspace.id); setProcesses(result.processes); setError(null); } catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.code : "request_failed"); } finally { setProcessesLoading(false); } }, [session]);
  const openProcess = useCallback(async (id: string) => { const result = await api.getProcess(id); loadServerProcess(result.process); localStorage.setItem(CURRENT_PROCESS_KEY, id); }, [loadServerProcess]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const result = await api.session();
        if (!active) return;
        setSession(result);
        setProcessesLoading(true);
        const processResult = await api.listProcesses(result.workspace.id);
        if (!active) return;
        setProcesses(processResult.processes);
        const id = localStorage.getItem(CURRENT_PROCESS_KEY);
        if (id) {
          try {
            const process = await api.getProcess(id);
            if (active) loadServerProcess(process.process);
          } catch {
            localStorage.removeItem(CURRENT_PROCESS_KEY);
          }
        }
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) {
          setProcessesLoading(false);
          setLoading(false);
        }
      }
    };

    void initialize();
    return () => { active = false; };
  }, [loadServerProcess]);

  const afterAuth = async (result: ApiSession) => { setSession(result); setError(null); await refreshProcesses(result); const state = useEditorStore.getState(); setMigrationNeeded(!state.isDemo && !state.currentProcessId && state.nodes.length > 0); };
  const login = async (email: string, password: string) => afterAuth(await api.login({ email, password }));
  const register = async (name: string, email: string, password: string) => afterAuth(await api.register({ name, email, password }));
  const logout = async () => { await api.logout(); setSession(null); setProcesses([]); setMigrationNeeded(false); localStorage.removeItem(CURRENT_PROCESS_KEY); clearServerBinding(); };
  const createProcessRequest = async (useCurrent: boolean, dismissMigration: boolean) => { if (!session) throw new ApiClientError(401, "unauthorized", "Authentication required"); const state = useEditorStore.getState(); const result = await api.createProcess({ workspaceId: session.workspace.id, name: useCurrent ? state.workflowName : (state.locale === "ru" ? "Новый процесс" : "New workflow"), nodes: useCurrent ? state.nodes : [], edges: useCurrent ? state.edges : [] }); loadServerProcess(result.process); localStorage.setItem(CURRENT_PROCESS_KEY, result.process.id); if (dismissMigration) setMigrationNeeded(false); await refreshProcesses(session); return result.process; };
  const createProcess = async (useCurrent = false) => createProcessRequest(useCurrent, true);
  const deleteProcess = async (id: string) => { await api.deleteProcess(id); if (useEditorStore.getState().currentProcessId === id) { localStorage.removeItem(CURRENT_PROCESS_KEY); clearServerBinding(); } await refreshProcesses(session); };
  const renameProcess = async (id: string, name: string) => { const current = (await api.getProcess(id)).process; const result = await api.updateProcess(id, { name: name.trim(), nodes: current.nodes, edges: current.edges, expectedVersion: current.currentVersion }); if (useEditorStore.getState().currentProcessId === id) loadServerProcess(result.process); await refreshProcesses(session); };
  const saveCurrent = async () => { const state = useEditorStore.getState(); if (!session || !state.currentProcessId || !state.currentServerVersion) return null; const result = await api.updateProcess(state.currentProcessId, { name: state.workflowName, nodes: state.nodes, edges: state.edges, expectedVersion: state.currentServerVersion }); state.setServerVersion(result.process.currentVersion); await refreshProcesses(session); return result.process; };
  const checkpoint = async () => { const id = useEditorStore.getState().currentProcessId; if (!id) return null; return (await api.checkpoint(id)).version; };
  const listVersions = async () => { const id = useEditorStore.getState().currentProcessId; if (!id) return []; return (await api.versions(id)).versions; };
  const restoreVersion = async (version: number) => { const id = useEditorStore.getState().currentProcessId; if (!id) return; const result = await api.restoreVersion(id, version); loadServerProcess(result.process); };
  const migrateLocal = async () => { await createProcessRequest(true, false); };
  const value: AccountContextValue = { session, loading, processes, processesLoading, error, migrationNeeded, login, register, logout, refreshProcesses: () => refreshProcesses(), createProcess, openProcess, renameProcess, deleteProcess, saveCurrent, checkpoint, listVersions, restoreVersion, migrateLocal, dismissMigration: () => setMigrationNeeded(false) };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() { const value = useContext(AccountContext); if (!value) throw new Error("useAccount must be used inside AccountProvider"); return value; }
