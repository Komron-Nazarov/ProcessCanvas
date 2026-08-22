"use client";

import { AlertCircle, History, LoaderCircle, RotateCcw, RotateCw, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import type { ApiVersion } from "@/lib/api-client";
import { useEditorStore } from "@/store/editor-store";
import { useAccount } from "./account-provider";

export function VersionHistory({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const account = useAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const current = useEditorStore((state) => state.currentServerVersion);
  const [items, setItems] = useState<ApiVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await accountRef.current.listVersions());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const checkpoint = async () => {
    setBusy(true);
    setError(false);
    try {
      await accountRef.current.checkpoint();
      await reload();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const restore = async (version: number) => {
    if (!window.confirm(t("versions.confirm"))) return;
    setBusy(true);
    try {
      await accountRef.current.restoreVersion(version);
      onClose();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Modal title={t("versions.title")} onClose={onClose} width="max-w-xl">
      <div className="p-5">
        <p className="mb-4 rounded-xl border border-line bg-canvas px-3 py-2 text-[10px] leading-5 text-muted">{t("versions.strategy")}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted">{t("versions.current", { version: current ?? "—" })}</p>
          <button className="primary-button" disabled={busy} onClick={() => void checkpoint()}>
            {busy ? <LoaderCircle className="animate-spin" size={13} /> : <Save size={13} />}{t("versions.create")}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-[10px] text-rose-700 dark:bg-rose-950 dark:text-rose-200">
            <span className="flex items-center gap-2"><AlertCircle size={13} />{t("versions.error")}</span>
            <button className="secondary-button" onClick={() => void reload()}><RotateCw size={12} />{t("library.retry")}</button>
          </div>
        )}
        {loading ? (
          <LoaderCircle className="mx-auto my-12 animate-spin text-muted" size={20} />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted">{t("versions.empty")}</p>
        ) : (
          <div className="mt-4 grid max-h-[52vh] gap-2 overflow-y-auto">
            {items.map((version) => (
              <article key={version.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand"><History size={15} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold" title={version.name}>{t("library.version", { version: version.version })} · {version.name}</div>
                  <div className="mt-1 text-[9px] text-muted">{t("versions.meta", { nodes: version.nodes.length, edges: version.edges.length })}</div>
                  <div className="mt-1 text-[9px] text-muted">{version.authorName} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(version.createdAt))}</div>
                </div>
                <button className="secondary-button" disabled={busy} onClick={() => void restore(version.version)}><RotateCcw size={12} />{t("versions.restore")}</button>
              </article>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
