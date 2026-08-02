"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useIsAdmin } from "@/lib/admin/useIsAdmin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAdminKeysStatus,
  useDeleteDartKey,
  useDeleteFinnhubKey,
  useSaveDartKey,
  useSaveFinnhubKey,
} from "@/lib/queries/useAdminKeys";

function KeyCard({
  label,
  hint,
  masked,
  exists,
  inputValue,
  onInputChange,
  onSave,
  onDelete,
  saving,
  deleting,
  errorMsg,
  successMsg,
  deleteConfirm,
  saveLabel,
  deleteLabel,
}: {
  label: string;
  hint: string;
  masked: string | undefined;
  exists: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
  errorMsg: string;
  successMsg: string;
  deleteConfirm: string;
  saveLabel: string;
  deleteLabel: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{label}</span>
        <span
          className={`text-[var(--text-sm)] ${
            exists ? "text-[var(--color-success-text)]" : "text-[var(--color-text-tertiary)]"
          }`}
        >
          {exists ? masked || "•••••" : hint}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="•••••••••••••••"
          className="min-w-[160px] flex-1"
          type="password"
        />
        <Button size="sm" variant="primary" className="shrink-0" onClick={onSave} disabled={saving || !inputValue.trim()}>
          {saveLabel}
        </Button>
        {exists && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => {
              if (confirm(deleteConfirm)) onDelete();
            }}
            disabled={deleting}
          >
            {deleteLabel}
          </Button>
        )}
      </div>
      {errorMsg && <div className="text-[var(--text-sm)] text-[var(--color-error-text)]">{errorMsg}</div>}
      {successMsg && <div className="text-[var(--text-sm)] text-[var(--color-success-text)]">{successMsg}</div>}
    </Card>
  );
}

export function KeysSection() {
  const t = useT();
  const isAdmin = useIsAdmin();
  const { data, isLoading, error, refetch } = useAdminKeysStatus();
  const saveDart = useSaveDartKey();
  const deleteDart = useDeleteDartKey();
  const saveFinnhub = useSaveFinnhubKey();
  const deleteFinnhub = useDeleteFinnhubKey();

  const [dartInput, setDartInput] = useState("");
  const [fhInput, setFhInput] = useState("");
  const [dartMsg, setDartMsg] = useState<{ err?: string; ok?: string }>({});
  const [fhMsg, setFhMsg] = useState<{ err?: string; ok?: string }>({});

  if (!isAdmin) return <EmptyState title={t("security.keys.adminOnly")} />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <EmptyState title={t("security.keys.error")} onRetry={() => refetch()} retryLabel={t("security.refresh")} />;

  function handleSaveDart() {
    setDartMsg({});
    saveDart.mutate(dartInput.trim(), {
      onSuccess: (res) => {
        setDartInput("");
        setDartMsg({ ok: t("security.keys.saved", { masked: res.masked ?? "" }) });
      },
      onError: (e) => setDartMsg({ err: e instanceof Error ? e.message : t("security.keys.saveError") }),
    });
  }

  function handleSaveFinnhub() {
    setFhMsg({});
    saveFinnhub.mutate(fhInput.trim(), {
      onSuccess: (res) => {
        setFhInput("");
        setFhMsg({ ok: t("security.keys.saved", { masked: res.masked ?? "" }) });
      },
      onError: (e) => setFhMsg({ err: e instanceof Error ? e.message : t("security.keys.saveError") }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("security.keys.description")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KeyCard
          label={t("security.keys.dart")}
          hint={t("security.keys.dart.hint")}
          masked={data?.dart.masked}
          exists={!!data?.dart.exists}
          inputValue={dartInput}
          onInputChange={setDartInput}
          onSave={handleSaveDart}
          onDelete={() => deleteDart.mutate()}
          saving={saveDart.isPending}
          deleting={deleteDart.isPending}
          errorMsg={dartMsg.err ?? ""}
          successMsg={dartMsg.ok ?? ""}
          deleteConfirm={t("security.keys.dart.deleteConfirm")}
          saveLabel={t("security.notice.save")}
          deleteLabel={t("security.delete")}
        />
        <KeyCard
          label={t("security.keys.finnhub")}
          hint={t("security.keys.finnhub.hint")}
          masked={data?.finnhub.masked}
          exists={!!data?.finnhub.exists}
          inputValue={fhInput}
          onInputChange={setFhInput}
          onSave={handleSaveFinnhub}
          onDelete={() => deleteFinnhub.mutate()}
          saving={saveFinnhub.isPending}
          deleting={deleteFinnhub.isPending}
          errorMsg={fhMsg.err ?? ""}
          successMsg={fhMsg.ok ?? ""}
          deleteConfirm={t("security.keys.finnhub.deleteConfirm")}
          saveLabel={t("security.notice.save")}
          deleteLabel={t("security.delete")}
        />
      </div>
    </div>
  );
}
