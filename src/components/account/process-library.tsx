"use client";

import { Clock3, FilePlus2, FolderOpen, LoaderCircle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import { useAccount } from "./account-provider";

export function ProcessLibrary({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n(); const account = useAccount();
  const create = async () => { await account.createProcess(false); onClose(); };
  const open = async (id: string) => { await account.openProcess(id); onClose(); };
  const remove = async (id: string) => { if (window.confirm(t("library.confirmDelete"))) await account.deleteProcess(id); };
  return <Modal title={t("library.title")} onClose={onClose} width="max-w-2xl"><div className="p-5"><div className="flex items-center justify-between gap-4"><p className="text-[11px] text-muted">{t("library.subtitle")}</p><button className="primary-button shrink-0" onClick={create}><FilePlus2 size={14} />{t("library.create")}</button></div><div className="mt-5 max-h-[55vh] overflow-y-auto">{account.processesLoading ? <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted"><LoaderCircle className="animate-spin" size={16} />{t("library.loading")}</div> : account.processes.length === 0 ? <div className="rounded-2xl border border-dashed border-line py-10 text-center"><FolderOpen className="mx-auto text-muted" size={22} /><h3 className="mt-3 text-xs font-bold">{t("library.empty")}</h3><p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-muted">{t("library.emptyText")}</p></div> : <div className="grid gap-2">{account.processes.map((process) => <article key={process.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><FolderOpen size={16} /></span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-bold">{process.name}</h3><div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-muted"><span>{t("library.version", { version: process.currentVersion })}</span><span className="flex items-center gap-1"><Clock3 size={10} />{t("library.updated", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(process.updatedAt)) })}</span></div></div><button className="secondary-button" onClick={() => open(process.id)}>{t("library.open")}</button><button className="icon-button text-rose-600" onClick={() => remove(process.id)} aria-label={t("library.delete")} title={t("library.delete")}><Trash2 size={15} /></button></article>)}</div>}</div></div></Modal>;
}
