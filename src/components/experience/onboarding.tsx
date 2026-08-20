"use client";

import { ArrowLeft, ArrowRight, Blocks, Link2, PanelRight, RotateCcw } from "lucide-react";
import { useState, type ComponentType } from "react";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";

const steps: { title: TranslationKey; text: TranslationKey; icon: ComponentType<{ size?: number }> }[] = [
  { title: "guide.1.title", text: "guide.1.text", icon: Blocks },
  { title: "guide.2.title", text: "guide.2.text", icon: Link2 },
  { title: "guide.3.title", text: "guide.3.text", icon: PanelRight },
  { title: "guide.4.title", text: "guide.4.text", icon: RotateCcw },
];

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const item = steps[index];
  const Icon = item.icon;
  return (
    <div className="fixed inset-x-0 bottom-5 z-[60] mx-auto w-[calc(100%-32px)] max-w-[520px] rounded-2xl border border-line bg-surface p-4 shadow-panel" role="dialog" aria-label={t("guide.label")}>
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={19} /></span>
        <div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{t("guide.step", { current: index + 1, total: steps.length })}</div><h2 className="mt-1 text-sm font-bold text-ink">{t(item.title)}</h2><p className="mt-1 text-[11px] leading-5 text-muted">{t(item.text)}</p></div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">{steps.map((_, step) => <span key={step} className={`h-1.5 rounded-full transition-all ${step === index ? "w-5 bg-brand" : "w-1.5 bg-line"}`} />)}</div>
        <div className="flex gap-2">
          {index > 0 && <button className="secondary-button" onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={14} />{t("guide.back")}</button>}
          <button className="primary-button" onClick={() => index === steps.length - 1 ? onFinish() : setIndex((value) => value + 1)}>{index === steps.length - 1 ? t("guide.finish") : t("guide.next")}<ArrowRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
