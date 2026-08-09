"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { ReportReason } from "@/types/models";

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "FRAUD", label: "Suspected fraud" }, { value: "INCCORECT_PRICE", label: "Incorrect price" }, { value: "PROPERTY_ALREADY_SOLD", label: "Property is no longer available" }, { value: "INCORRECT_INFORMATION", label: "Incorrect information" }, { value: "DUBLICATE", label: "Duplicate listing" }, { value: "OTHER", label: "Other" },
];

export function PropertyReportDialog({ propertyId }: { propertyId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const close = () => { if (!busy) { setOpen(false); setError(""); } };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason || !description.trim()) { setError("Choose a reason and add a short description."); return; }
    setBusy(true); setError("");
    try { await propertiesApi.report(propertyId, { report: reason, description: description.trim() }); setSubmitted(true); setOpen(false); setReason(""); setDescription(""); }
    catch (cause) { const message = apiMessage(cause); setError(message === "You already reported this property" ? "You have already reported this listing." : message); }
    finally { setBusy(false); }
  };
  const trigger = () => { if (!user) { router.push("/login"); return; } setOpen(true); };
  return <><button type="button" onClick={trigger} className="report-trigger"><Flag size={15}/> Report listing</button>{submitted && <p className="report-submitted" role="status"><strong>Report submitted.</strong> Thank you. Our moderation team will review this listing.</p>}{open && <div className="dialog-backdrop" role="presentation" onMouseDown={close}><section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onMouseDown={(event) => event.stopPropagation()}><form onSubmit={submit}><div className="dialog-header"><div><p className="eyebrow">Moderation</p><h2 id="report-dialog-title">Report this listing</h2></div><button type="button" onClick={close} aria-label="Close report dialog"><X size={19}/></button></div><p className="dialog-description">Tell us what is wrong with this property. Our moderation team will review your report.</p><fieldset className="report-reasons"><legend>Reason <span>*</span></legend>{reasons.map((item) => <label className={`report-reason ${reason === item.value ? "is-selected" : ""}`} key={item.value}><input type="radio" name="reason" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)}/><span>{item.label}</span></label>)}</fieldset><label className="report-description"><span>Additional details <b>*</b></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={1} placeholder="Tell us a little more about the issue."/></label>{error && <p className="notice notice-error">{error}</p>}<div className="dialog-actions"><button type="button" onClick={close} className="btn-secondary">Cancel</button><button disabled={busy || !reason || !description.trim()} className="btn-primary">{busy ? "Submitting..." : "Submit report"}</button></div></form></section></div>}</>;
}
