"use client";

import { History, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import type { ApiVersion } from "@/lib/api-client";
import { useEditorStore } from "@/store/editor-store";
import { useAccount } from "./account-provider";

export function VersionHistory({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n(); const account = useAccount(); const current = useEditorStore((state) => state.currentServerVersion); const [items, setItems] = useState<ApiVersion[]>([]); const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { setLoading(true); try { setItems(await account.listVersions()); } finally { setLoading(false); } }, [account]);
  useEffect(() => { void reload(); }, [reload]);
  const checkpoint = async () => { await account.checkpoint(); await reload(); };
  const restore = async (version: number) => { if (!window.confirm(t("versions.confirm"))) return; await account.restoreVersion(version); onClose(); };
  return <Modal title={t("versions.title")} onClose={onClose} width="max-w-xl"><div className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] text-muted">{t("versions.current", { version: current ?? "—" })}</p><button className="primary-button" onClick={checkpoint}><Save size={13} />{t("versions.create")}</button></div>{loading ? <LoaderCircle className="mx-auto my-12 animate-spin text-muted" size={20} /> : items.length === 0 ? <p className="py-12 text-center text-xs text-muted">{t("versions.empty")}</p> : <div className="mt-4 grid max-h-[52vh] gap-2 overflow-y-auto">{items.map((version) => <article key={version.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand"><History size={15} /></span><div className="min-w-0 flex-1"><div className="text-xs font-bold">{t("library.version", { version: version.version })} · {version.name}</div><div className="mt-1 text-[9px] text-muted">{version.authorName} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(version.createdAt))}</div></div><button className="secondary-button" onClick={() => restore(version.version)}><RotateCcw size={12} />{t("versions.restore")}</button></article>)}</div>}</div></Modal>;
}
