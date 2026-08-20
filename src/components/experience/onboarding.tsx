"use client";

import { ArrowRight, GraduationCap, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export function Onboarding({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  return <div className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation"><section className="animate-modal relative w-full max-w-[520px] overflow-hidden rounded-3xl border border-line bg-surface shadow-panel" role="dialog" aria-modal="true" aria-label={t("welcome.title")}><button className="icon-button absolute right-4 top-4" onClick={onSkip} aria-label={t("welcome.skip")}><X size={17} /></button><div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400" /><div className="p-7 sm:p-9"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><GraduationCap size={22} /></span><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.17em] text-brand">{t("welcome.eyebrow")}</p><h2 className="mt-2 max-w-[390px] text-2xl font-extrabold leading-tight tracking-[-0.035em] text-ink">{t("welcome.title")}</h2><p className="mt-3 max-w-[420px] text-xs leading-6 text-muted">{t("welcome.text")}</p><div className="mt-7 flex flex-wrap items-center gap-3"><button className="primary-button px-5 py-2.5" onClick={onStart}>{t("welcome.start")}<ArrowRight size={14} /></button><button className="secondary-button" onClick={onSkip}>{t("welcome.skip")}</button></div><p className="mt-4 text-[10px] text-muted">{t("welcome.replay")}</p></div></section></div>;
}
