"use client";

import { CheckCircle2, CloudUpload, FolderOpen, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import { clearWorkspace } from "@/lib/persistence";
import { clearServerDraft } from "@/lib/server-draft";
import { useAccount } from "./account-provider";

export function MigrationPrompt({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { t } = useI18n();
  const account = useAccount();
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState(false);

  const migrate = async () => {
    setSaving(true);
    setError(false);
    try {
      await account.migrateLocal();
      setComplete(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (complete) {
    return (
      <Modal title={t("migration.successTitle")} onClose={account.dismissMigration}>
        <div className="p-5 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={34} />
          <p className="mt-4 text-xs leading-6 text-muted">{t("migration.successText")}</p>
          <button className="primary-button mx-auto mt-5" onClick={account.dismissMigration}>{t("migration.done")}</button>
          <button className="mx-auto mt-3 flex items-center gap-2 text-[10px] font-bold text-muted hover:text-rose-600" onClick={() => { clearWorkspace(); clearServerDraft(); account.dismissMigration(); }}>
            <Trash2 size={12} />{t("migration.removeLocal")}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t("migration.title")} onClose={account.dismissMigration}>
      <div className="p-5">
        <p className="text-xs leading-6 text-muted">{t("migration.text")}</p>
        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-200">{t("migration.error")}</p>}
        <div className="mt-5 grid gap-2">
          <button className="primary-button" disabled={saving} onClick={() => void migrate()}>{saving ? <LoaderCircle className="animate-spin" size={14} /> : <CloudUpload size={14} />}{t("migration.save")}</button>
          <button className="secondary-button justify-center" disabled={saving} onClick={() => { account.dismissMigration(); onOpenLibrary(); }}><FolderOpen size={14} />{t("migration.open")}</button>
          <button className="mt-1 text-[10px] font-bold text-muted hover:text-ink" disabled={saving} onClick={account.dismissMigration}>{t("migration.keep")}</button>
        </div>
      </div>
    </Modal>
  );
}
