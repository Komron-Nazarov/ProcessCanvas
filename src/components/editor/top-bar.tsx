"use client";

import { CircleHelp, Info, Moon, Play, Redo2, Sun, Undo2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/types";
import { useEditorStore } from "@/store/editor-store";

export function TopBar({ onGuide, onAbout, onRun }: { onGuide: () => void; onAbout: () => void; onRun: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const workflowName = useEditorStore((state) => state.workflowName);
  const setWorkflowName = useEditorStore((state) => state.setWorkflowName);
  const theme = useEditorStore((state) => state.theme);
  const setTheme = useEditorStore((state) => state.setTheme);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const changeLocale = (next: Locale) => { if (next !== locale) setLocale(next); };
  return <header className="top-bar flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-surface px-4 lg:px-5"><div className="brand-area flex min-w-[214px] items-center gap-3"><span className="brand-mark"><i /><i /><i /></span><div><div className="text-[15px] font-extrabold tracking-[-0.035em]">ProcessCanvas</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">{t("app.tagline")}</div></div></div><div className="h-8 w-px bg-line" /><div className="min-w-0 flex-1"><input aria-label={t("top.workflowName")} value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} className="w-full max-w-[380px] rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold tracking-[-0.01em] text-ink transition hover:border-line focus:border-brand focus:bg-canvas" /><div data-tutorial-target="save-status" className="ml-2 mt-0.5 flex items-center gap-1.5 text-[9px] font-medium text-muted"><span className={`h-1.5 w-1.5 rounded-full ${saveStatus === "saving" ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} />{saveStatus === "saving" ? t("status.saving") : t("status.saved")}<span className="hidden xl:inline">· {t("status.local")}</span></div></div><div className="flex items-center gap-1"><button data-tutorial-target="undo" onClick={() => undo()} disabled={!canUndo} aria-label={t("top.undo")} title={`${t("top.undo")} · Ctrl/⌘ Z`} className="icon-button"><Undo2 size={17} /></button><button data-tutorial-target="redo" onClick={() => redo()} disabled={!canRedo} aria-label={t("top.redo")} title={`${t("top.redo")} · Ctrl/⌘ Shift Z`} className="icon-button"><Redo2 size={17} /></button><span className="mx-1 h-5 w-px bg-line" /><button onClick={onGuide} aria-label={t("top.guide")} title={t("top.guide")} className="icon-button"><CircleHelp size={17} /></button><button onClick={onAbout} aria-label={t("top.about")} title={t("top.about")} className="icon-button"><Info size={17} /></button><div className="language-switch ml-1 flex rounded-lg border border-line bg-canvas p-0.5" aria-label={t("top.language")}>{(["ru", "en"] as Locale[]).map((item) => <button key={item} onClick={() => changeLocale(item)} className={`rounded-md px-2 py-1.5 text-[9px] font-bold uppercase transition ${locale === item ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`} aria-pressed={locale === item}>{item}</button>)}</div><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t("top.themeLight") : t("top.themeDark")} title={theme === "dark" ? t("top.themeLight") : t("top.themeDark")} className="icon-button ml-1">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button onClick={onRun} title={t("top.run")} className="run-button ml-2 opacity-100" aria-label={t("top.run")}><Play size={13} fill="currentColor" />{t("top.run")}</button></div></header>;
}
