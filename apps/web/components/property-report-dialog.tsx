"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { ReportReason } from "@/types/models";

const reasonKeys: Array<{ value: ReportReason; key: string }> = [
  { value: "FRAUD", key: "Suspected fraud" }, { value: "INCCORECT_PRICE", key: "Incorrect price" }, { value: "PROPERTY_ALREADY_SOLD", key: "Property is no longer available" }, { value: "INCORRECT_INFORMATION", key: "Incorrect information" }, { value: "DUBLICATE", key: "Duplicate listing" }, { value: "OTHER", key: "Other" },
];
const reportLabels: Record<ReportReason, { en: string; ru: string; am: string }> = {
  FRAUD: { en: "Suspected fraud", ru: "Подозрение на мошенничество", am: "Խարդախության կասկած" }, INCCORECT_PRICE: { en: "Incorrect price", ru: "Некорректная цена", am: "Սխալ գին" }, PROPERTY_ALREADY_SOLD: { en: "Property is no longer available", ru: "Объект больше недоступен", am: "Գույքն այլևս հասանելի չէ" }, INCORRECT_INFORMATION: { en: "Incorrect information", ru: "Некорректная информация", am: "Սխալ տեղեկություն" }, DUBLICATE: { en: "Duplicate listing", ru: "Дубликат объявления", am: "Կրկնվող հայտարարություն" }, OTHER: { en: "Other", ru: "Другое", am: "Այլ" },
};

export function PropertyReportDialog({ propertyId }: { propertyId: number }) {
  const router = useRouter(); const { user } = useAuth(); const { locale, t } = useI18n();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState<ReportReason | "">(""); const [description, setDescription] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [submitted, setSubmitted] = useState(false);
  const close = () => { if (!busy) { setOpen(false); setError(""); } };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!reason || !description.trim()) { setError(t("property.additionalDetails")); return; } setBusy(true); setError(""); try { await propertiesApi.report(propertyId, { report: reason, description: description.trim() }); setSubmitted(true); setOpen(false); setReason(""); setDescription(""); } catch (cause) { const message = apiMessage(cause); setError(message === "You already reported this property" ? t("property.alreadyReported") : message); } finally { setBusy(false); } };
  const trigger = () => { if (!user) { router.push("/login"); return; } setOpen(true); };
  return <><button type="button" onClick={trigger} className="report-trigger"><Flag size={15}/> {t("property.reportListing")}</button>{submitted && <p className="report-submitted" role="status"><strong>{t("property.reportSubmitted")}.</strong> {t("property.reportThanks")}</p>}{open && <div className="dialog-backdrop" role="presentation" onMouseDown={close}><section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onMouseDown={(event) => event.stopPropagation()}><form onSubmit={submit}><div className="dialog-header"><div><p className="eyebrow">{t("property.reportListing")}</p><h2 id="report-dialog-title">{t("property.reportTitle")}</h2></div><button type="button" onClick={close} aria-label={t("common.close")}><X size={19}/></button></div><p className="dialog-description">{t("property.reportCopy")}</p><fieldset className="report-reasons"><legend>{t("property.reportListing")} <span>*</span></legend>{reasonKeys.map((item) => <label className={`report-reason ${reason === item.value ? "is-selected" : ""}`} key={item.value}><input type="radio" name="reason" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)}/><span>{reportLabels[item.value][locale]}</span></label>)}</fieldset><label className="report-description"><span>{t("property.additionalDetails")} <b>*</b></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={1} placeholder={t("property.additionalDetails")}/></label>{error && <p className="notice notice-error">{error}</p>}<div className="dialog-actions"><button type="button" onClick={close} className="btn-secondary">{t("common.cancel")}</button><button disabled={busy || !reason || !description.trim()} className="btn-primary">{busy ? t("property.submitting") : t("property.submitReport")}</button></div></form></section></div>}</>;
}
