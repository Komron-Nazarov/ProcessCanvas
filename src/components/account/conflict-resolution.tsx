"use client";

import { Cloud, CopyPlus, HardDrive, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import type { ApiProcess } from "@/lib/api-client";

export function ConflictResolution({ serverProcess, onLoadServer, onSaveCopy, onKeepLocal }: {
  serverProcess: ApiProcess;
  onLoadServer: () => void;
  onSaveCopy: () => Promise<void>;
  onKeepLocal: () => void;
}) {
  const { t, locale } = useI18n();
  const [saving, setSaving] = useState(false);
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(serverProcess.updatedAt));
  return (
    <Modal title={t("conflict.title")} onClose={onKeepLocal} width="max-w-lg">
      <div className="p-5">
        <p className="text-xs leading-6 text-muted">{t("conflict.text")}</p>
        <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
          <div className="text-xs font-bold text-ink">{serverProcess.name}</div>
          <div className="mt-1 text-[10px] text-muted">{t("conflict.serverMeta", { version: serverProcess.currentVersion, date: updated })}</div>
        </div>
        <div className="mt-5 grid gap-2">
          <button className="primary-button justify-center" onClick={onLoadServer}><Cloud size={14} />{t("conflict.loadServer")}</button>
          <button className="secondary-button justify-center" disabled={saving} onClick={() => { setSaving(true); void onSaveCopy().finally(() => setSaving(false)); }}>
            {saving ? <LoaderCircle className="animate-spin" size={14} /> : <CopyPlus size={14} />}{t("conflict.saveCopy")}
          </button>
          <button className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold text-muted hover:text-ink" onClick={onKeepLocal}><HardDrive size={13} />{t("conflict.keepLocal")}</button>
        </div>
        <p className="mt-4 text-[9px] leading-4 text-muted">{t("conflict.safety")}</p>
      </div>
    </Modal>
  );
}
