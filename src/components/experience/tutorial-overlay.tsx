"use client";

import { ArrowLeft, Check, LogOut, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import { isTutorialStepComplete, TUTORIAL_TOTAL_STEPS } from "@/lib/tutorial";
import { useEditorStore } from "@/store/editor-store";

const steps = Array.from({ length: TUTORIAL_TOTAL_STEPS }, (_, index) => ({ title: `tutorial.step${index + 1}.title` as TranslationKey, text: `tutorial.step${index + 1}.text` as TranslationKey }));

export function TutorialOverlay() {
  const { t } = useI18n();
  const step = useEditorStore((state) => state.tutorialStep);
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const events = useEditorStore((state) => state.tutorialEvents);
  const setStep = useEditorStore((state) => state.setTutorialStep);
  const exit = useEditorStore((state) => state.exitTutorial);
  const complete = useEditorStore((state) => state.completeTutorial);
  const done = step === TUTORIAL_TOTAL_STEPS - 1;

  useEffect(() => { document.body.dataset.tutorialStep = String(step); return () => { delete document.body.dataset.tutorialStep; }; }, [step]);
  useEffect(() => {
    if (done || !isTutorialStepComplete(step, nodes, edges, events)) return;
    const timer = window.setTimeout(() => setStep(step + 1), 450);
    return () => window.clearTimeout(timer);
  }, [done, edges, events, nodes, setStep, step]);

  const leave = () => { if (window.confirm(t("tutorial.confirmExit"))) exit(); };
  return <><aside className="tutorial-card fixed bottom-5 left-1/2 z-[55] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 shadow-panel" aria-live="polite" aria-label={t("tutorial.label")}><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{done ? <Check size={17} /> : <Sparkles size={17} />}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-brand">{t("tutorial.progress", { current: step + 1, total: TUTORIAL_TOTAL_STEPS })}</span><button className="flex items-center gap-1 text-[9px] font-bold text-muted hover:text-ink" onClick={leave}><LogOut size={12} />{t("tutorial.exit")}</button></div><h2 className="mt-1.5 text-sm font-extrabold text-ink">{t(steps[step].title)}</h2><p className="mt-1 text-[11px] leading-5 text-muted">{t(steps[step].text)}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((step + 1) / TUTORIAL_TOTAL_STEPS) * 100}%` }} /></div>{step > 0 && !done && <button className="icon-button" onClick={() => setStep(step - 1)} aria-label={t("tutorial.back")} title={t("tutorial.back")}><ArrowLeft size={15} /></button>}</div></aside>{done && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-[2px]"><section className="animate-modal w-full max-w-md rounded-3xl border border-line bg-surface p-7 text-center shadow-panel" role="dialog" aria-modal="true"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check size={22} /></span><h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink">{t("tutorial.completeTitle")}</h2><p className="mt-2 text-xs leading-6 text-muted">{t("tutorial.completeText")}</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button className="primary-button" onClick={() => complete("blank")}>{t("tutorial.blank")}</button><button className="secondary-button justify-center" onClick={() => complete("demo")}>{t("tutorial.demo")}</button></div></section></div>}</>;
}
