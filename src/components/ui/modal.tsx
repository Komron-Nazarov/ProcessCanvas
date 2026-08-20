"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/i18n/provider";

export function Modal({ title, onClose, children, width = "max-w-md" }: { title: string; onClose: () => void; children: ReactNode; width?: string }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`animate-modal w-full ${width} rounded-2xl border border-line bg-surface shadow-panel`}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-sm font-bold text-ink">{title}</h2><button onClick={onClose} aria-label={t("dialog.close")} className="icon-button"><X size={17} /></button></header>
        {children}
      </section>
    </div>
  );
}
