"use client";

import { CloudUpload, FolderOpen } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/provider";
import { useAccount } from "./account-provider";

export function MigrationPrompt({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { t } = useI18n(); const account = useAccount();
  return <Modal title={t("migration.title")} onClose={account.dismissMigration}><div className="p-5"><p className="text-xs leading-6 text-muted">{t("migration.text")}</p><div className="mt-5 grid gap-2"><button className="primary-button" onClick={account.migrateLocal}><CloudUpload size={14} />{t("migration.save")}</button><button className="secondary-button justify-center" onClick={() => { account.dismissMigration(); onOpenLibrary(); }}><FolderOpen size={14} />{t("migration.open")}</button><button className="mt-1 text-[10px] font-bold text-muted hover:text-ink" onClick={account.dismissMigration}>{t("migration.keep")}</button></div></div></Modal>;
}
