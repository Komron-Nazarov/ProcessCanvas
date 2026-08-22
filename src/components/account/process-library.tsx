"use client";

import { Check, FolderOpen, LoaderCircle, Pencil, Plus, RotateCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import { useAccount } from "./account-provider";

export function ProcessLibrary({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const account = useAccount();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [actionError, setActionError] = useState(false);

  const run = async (id: string, action: () => Promise<void>, close = false) => {
    setBusyId(id);
    setActionError(false);
    try {
      await action();
      if (close) onClose();
      return true;
    } catch {
      setActionError(true);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const beginRename = (id: string, name: string) => {
    setEditingId(id);
    setDraftName(name);
  };

  const saveRename = async (id: string) => {
    const name = draftName.trim();
    if (!name) return;
    if (await run(id, () => account.renameProcess(id, name))) setEditingId(null);
  };

  return (
    <Modal title={t("library.title")} onClose={onClose} width="max-w-2xl">
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] text-muted">{t("library.subtitle")}</p>
          <button
            className="primary-button"
            disabled={busyId !== null}
            onClick={() => void run("new", async () => { await account.createProcess(); }, true)}
          >
            {busyId === "new" ? <LoaderCircle className="animate-spin" size={14} /> : <Plus size={14} />}
            {t("library.create")}
          </button>
        </div>

        {(account.error || actionError) && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <span>{t(actionError ? "library.actionError" : "library.error")}</span>
            <button className="secondary-button" onClick={() => void account.refreshProcesses()}>
              <RotateCw size={12} />
              {t("library.retry")}
            </button>
          </div>
        )}

        {account.processesLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <LoaderCircle className="animate-spin" size={22} />
            <span className="mt-2 text-[10px]">{t("library.loading")}</span>
          </div>
        ) : account.processes.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-canvas px-5 py-12 text-center">
            <FolderOpen className="mx-auto text-muted" size={26} />
            <h3 className="mt-3 text-xs font-bold">{t("library.empty")}</h3>
            <p className="mx-auto mt-1 max-w-sm text-[10px] text-muted">{t("library.emptyText")}</p>
          </div>
        ) : (
          <div className="mt-5 grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
            {account.processes.map((process) => {
              const busy = busyId === process.id;
              const editing = editingId === process.id;
              const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(process.updatedAt));

              return (
                <article key={process.id} className="rounded-xl border border-line bg-canvas p-3 transition-colors hover:border-brand/40">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <FolderOpen size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <form className="flex gap-1.5" onSubmit={(event) => { event.preventDefault(); void saveRename(process.id); }}>
                          <input
                            autoFocus
                            maxLength={160}
                            className="min-w-0 flex-1 rounded-lg border border-brand bg-surface px-2 py-1 text-xs font-bold outline-none"
                            value={draftName}
                            onChange={(event) => setDraftName(event.target.value)}
                          />
                          <button className="icon-button" disabled={busy || !draftName.trim()} aria-label={t("library.saveName")}>
                            {busy ? <LoaderCircle className="animate-spin" size={14} /> : <Check size={14} />}
                          </button>
                          <button type="button" className="icon-button" onClick={() => setEditingId(null)} aria-label={t("dialog.close")}>
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1">
                          <h3 className="truncate text-xs font-bold" title={process.name}>{process.name}</h3>
                          <button className="icon-button h-7 w-7 shrink-0" onClick={() => beginRename(process.id, process.name)} aria-label={t("library.rename")}>
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                      <p className="mt-1 text-[9px] text-muted">
                        {t("library.version", { version: process.currentVersion })} · {t("library.updated", { date })}
                      </p>
                    </div>
                    {!editing && (
                      <div className="flex shrink-0 gap-1.5">
                        <button className="secondary-button" disabled={busyId !== null} onClick={() => void run(process.id, () => account.openProcess(process.id), true)}>
                          {busy ? <LoaderCircle className="animate-spin" size={12} /> : <FolderOpen size={12} />}
                          {t("library.open")}
                        </button>
                        <button
                          className="icon-button text-rose-600"
                          disabled={busyId !== null}
                          aria-label={t("library.delete")}
                          title={t("library.delete")}
                          onClick={() => {
                            if (window.confirm(t("library.confirmDelete"))) void run(process.id, () => account.deleteProcess(process.id));
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
