"use client";

import { ExternalLink, Github, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { Modal } from "@/components/ui/modal";

export function AboutModal({ onClose, onReplayIntro, onReset }: { onClose: () => void; onReplayIntro: () => void; onReset: () => void }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Modal title={t("about.title")} onClose={onClose}>
        <div className="p-5">
          <div className="flex items-center gap-3"><span className="brand-mark brand-mark-small"><i /><i /><i /></span><div><div className="text-base font-bold tracking-tight">ProcessCanvas</div><div className="text-[10px] text-muted">PC-2 · Local workspace</div></div></div>
          <p className="mt-5 text-xs leading-6 text-muted">{t("about.description")}</p>
          <p className="mt-3 border-l-2 border-brand pl-3 text-xs font-semibold text-ink">{t("about.credit")}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <a className="secondary-button justify-center" href="https://github.com/Komron-Nazarov" target="_blank" rel="noreferrer"><Github size={14} />{t("about.github")}<ExternalLink size={11} /></a>
            <a className="secondary-button justify-center" href="https://kn-portfolio-one.vercel.app/" target="_blank" rel="noreferrer">{t("about.portfolio")}<ExternalLink size={11} /></a>
          </div>
          <div className="mt-5 flex gap-2 border-t border-line pt-4"><button onClick={onReplayIntro} className="secondary-button flex-1 justify-center"><Play size={13} />{t("about.replay")}</button><button onClick={() => setConfirming(true)} className="danger-button flex-1 justify-center"><RotateCcw size={13} />{t("about.reset")}</button></div>
        </div>
      </Modal>
      {confirming && <Modal title={t("confirm.title")} onClose={() => setConfirming(false)} width="max-w-sm"><div className="p-5"><p className="text-xs leading-5 text-muted">{t("confirm.text")}</p><div className="mt-5 flex justify-end gap-2"><button className="secondary-button" onClick={() => setConfirming(false)}>{t("confirm.cancel")}</button><button className="danger-button" onClick={onReset}>{t("confirm.reset")}</button></div></div></Modal>}
    </>
  );
}
