"use client";

import { BookOpen, Boxes, History, Link2, MessageCircleQuestion, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/types";
import { Modal } from "@/components/ui/modal";

const topics: { title: TranslationKey; text: TranslationKey; icon: typeof BookOpen }[] = [
  { title: "help.create.title", text: "help.create.text", icon: BookOpen }, { title: "help.nodes.title", text: "help.nodes.text", icon: Boxes }, { title: "help.links.title", text: "help.links.text", icon: Link2 }, { title: "help.history.title", text: "help.history.text", icon: History }, { title: "help.faq.title", text: "help.faq.text", icon: MessageCircleQuestion },
];

export function HelpCenter({ onClose, onTutorial, onDemo }: { onClose: () => void; onTutorial: () => void; onDemo: () => void }) {
  const { t } = useI18n();
  return <Modal title={t("help.title")} onClose={onClose} width="max-w-2xl"><div className="max-h-[72vh] overflow-y-auto p-5"><p className="text-xs text-muted">{t("help.subtitle")}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button className="primary-button justify-center" onClick={onTutorial}><Play size={14} />{t("help.replay")}</button><button className="secondary-button justify-center" onClick={onDemo}><RotateCcw size={14} />{t("help.demo")}</button></div><div className="mt-5 grid gap-2">{topics.map(({ title, text, icon: Icon }) => <details key={title} className="group rounded-xl border border-line bg-canvas open:bg-surface"><summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 text-xs font-bold text-ink"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon size={15} /></span>{t(title)}</summary><p className="px-4 pb-4 pl-[58px] text-[11px] leading-5 text-muted">{t(text)}</p></details>)}</div></div></Modal>;
}
