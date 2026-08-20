"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/provider";

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(onFinish, reduced ? 500 : 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);
  return (
    <div className="intro-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111a2a] text-white" role="dialog" aria-label="ProcessCanvas intro">
      <div className="intro-mark" aria-hidden="true"><i /><i /><i /><span /><span /></div>
      <h1 className="mt-7 text-3xl font-bold tracking-[-0.04em]">ProcessCanvas</h1>
      <p className="mt-2 text-sm text-slate-300">{t("intro.subtitle")}</p>
      <div className="mt-9 text-center text-[11px] leading-5 text-slate-400"><span>{t("intro.credit")}</span><strong className="block text-xs font-semibold text-white">{t("intro.author")}</strong></div>
      <button onClick={onFinish} className="absolute bottom-7 rounded-lg px-3 py-2 text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-white">{t("intro.skip")}</button>
    </div>
  );
}
