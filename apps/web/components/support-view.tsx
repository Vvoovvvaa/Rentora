"use client";

import { AxiosError } from "axios";
import { CheckCircle2, ChevronRight, CircleAlert, ClipboardList, Headphones, LoaderCircle, Plus, Send, Ticket, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiMessage, supportApi } from "@/lib/api";
import type { SupportStatus, SupportTicket, SupportTicketType } from "@/types/models";
import { useI18n } from "@/context/i18n-context";
import { CustomSelect } from "./custom-select";

const ticketTypes: SupportTicketType[] = ["ACCOUNT", "PROPERTY", "PAYMENT", "CHAT", "TECHNICAL_PROBLEM", "MODERATION", "SECURITY", "FEATURE_REQUEST", "OTHER"];

function statusTone(status: SupportStatus) {
  if (status === "CLOSED" || status === "CANCELED") return "is-muted";
  if (status === "RESOLVED") return "is-success";
  if (status === "OPEN" || status === "IN_PROGRESS") return "is-active";
  return "is-waiting";
}

function isEmptyListError(reason: unknown) {
  const error = reason as AxiosError<{ message?: string | string[] }>;
  const message = error.response?.data?.message;
  const text = Array.isArray(message) ? message.join(" ") : message || "";
  return error.response?.status === 400 && /no support|обращен|աջակցության/i.test(text);
}

function StatusBadge({ status }: { status: SupportStatus }) {
  const { t } = useI18n();
  return <span className={`support-status ${statusTone(status)}`}>{t(`support.statuses.${status}`)}</span>;
}

type Notice = { tone: "success" | "error"; message: string } | null;

export function SupportView() {
  const { t, formatDate } = useI18n();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supportApi.mine();
      setTickets([...result].sort((first, second) => new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()));
    } catch (reason) {
      if (isEmptyListError(reason)) setTickets([]);
      else setNotice({ tone: "error", message: apiMessage(reason) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void loadTickets(); }, 0); return () => window.clearTimeout(timer); }, [loadTickets]);

  const openTicket = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    try {
      setActiveTicket(await supportApi.one(ticket.id));
    } catch (reason) {
      setNotice({ tone: "error", message: apiMessage(reason) });
    }
  };

  const completeCreate = async () => {
    await loadTickets();
    setFormOpen(false);
    setNotice({ tone: "success", message: t("support.created") });
  };

  const completeCancel = async (ticketId: number) => {
    const result = await supportApi.cancel(ticketId);
    setTickets((current) => current.map((ticket) => ticket.id === ticketId ? { ...ticket, status: "CANCELED" } : ticket));
    setActiveTicket((current) => current?.id === ticketId ? { ...current, status: "CANCELED" } : current);
    setNotice({ tone: "success", message: result.message || t("support.canceled") });
  };

  return <main className="support-page">
    <div className="shell support-shell">
      <section className="support-hero">
        <div>
          <p className="eyebrow">{t("support.eyebrow")}</p>
          <h1>{t("support.title")}</h1>
          <p>{t("support.subtitle")}</p>
        </div>
        <button type="button" className="support-create-button" onClick={() => setFormOpen(true)}><Plus size={18}/>{t("support.createTicket")}</button>
      </section>

      {notice && <p className={`support-notice ${notice.tone === "success" ? "is-success" : "is-error"}`} role="status">{notice.tone === "success" ? <CheckCircle2 size={17}/> : <CircleAlert size={17}/>} {notice.message}</p>}

      {formOpen && <SupportCompose onClose={() => setFormOpen(false)} onComplete={completeCreate}/>} 

      <section className="support-ticket-section">
        <header className="support-section-heading">
          <div><p className="eyebrow">{t("support.myTickets")}</p><h2>{t("support.ticketHistory")}</h2></div>
          {!loading && <span>{t("support.ticketsCount", { count: tickets.length })}</span>}
        </header>
        {loading ? <div className="support-loading"><LoaderCircle size={28} className="animate-spin"/>{t("common.loading")}</div> : tickets.length ? <div className="support-ticket-list">
          {tickets.map((ticket) => <button type="button" key={ticket.id} className="support-ticket-card" onClick={() => void openTicket(ticket)}>
            <span className="support-ticket-icon"><Ticket size={19}/></span>
            <span className="support-ticket-copy"><span className="support-ticket-meta">#{ticket.id} · {t(`support.tickets.${ticket.ticket}`)}</span><strong>{ticket.subject}</strong><small>{ticket.message}</small></span>
            <span className="support-ticket-end"><StatusBadge status={ticket.status}/><time>{ticket.createdAt ? formatDate(ticket.createdAt) : "—"}</time><ChevronRight size={18}/></span>
          </button>)}
        </div> : <div className="support-empty"><ClipboardList size={31}/><h2>{t("support.noTickets")}</h2><p>{t("support.noTicketsCopy")}</p><button type="button" className="btn-primary" onClick={() => setFormOpen(true)}><Plus size={17}/>{t("support.createTicket")}</button></div>}
      </section>
    </div>
    {activeTicket && <SupportTicketDialog ticket={activeTicket} onClose={() => setActiveTicket(null)} onCancel={completeCancel}/>} 
  </main>;
}

function SupportCompose({ onClose, onComplete }: { onClose: () => void; onComplete: () => Promise<void> }) {
  const { t } = useI18n();
  const [ticket, setTicket] = useState<SupportTicketType | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket || busy) return;
    setBusy(true); setError("");
    try { await supportApi.create({ ticket, subject: subject.trim(), message: message.trim() }); await onComplete(); }
    catch (reason) { setError(apiMessage(reason)); }
    finally { setBusy(false); }
  };
  return <section className="support-compose" aria-labelledby="support-compose-title">
    <div className="support-compose-heading"><div><p className="eyebrow">{t("support.newTicket")}</p><h2 id="support-compose-title">{t("support.tellUs")}</h2><p>{t("support.composeCopy")}</p></div><button type="button" className="support-close" onClick={onClose} aria-label={t("common.close")}><X size={18}/></button></div>
    <form onSubmit={submit} className="support-compose-form">
      <label><span>{t("support.category")}</span><CustomSelect value={ticket} onChange={(value) => setTicket(value as SupportTicketType)} placeholder={t("support.chooseCategory")} ariaLabel={t("support.category")} options={ticketTypes.map((value) => ({ value, label: t(`support.tickets.${value}`) }))}/></label>
      <label><span>{t("support.subject")}</span><input className="field" required maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t("support.subjectPlaceholder")}/></label>
      <label className="support-message-field"><span>{t("support.message")}</span><textarea required minLength={1} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t("support.messagePlaceholder")}/></label>
      {error && <p className="support-inline-error"><CircleAlert size={16}/>{error}</p>}
      <div className="support-compose-actions"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>{t("common.cancel")}</button><button className="btn-primary" disabled={busy || !ticket}>{busy ? <LoaderCircle size={17} className="animate-spin"/> : <Send size={17}/>} {busy ? t("support.sending") : t("support.send")}</button></div>
    </form>
  </section>;
}

function SupportTicketDialog({ ticket, onClose, onCancel }: { ticket: SupportTicket; onClose: () => void; onCancel: (ticketId: number) => Promise<void> }) {
  const { t, formatDate } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCancel = ticket.status !== "CLOSED" && ticket.status !== "CANCELED" && ticket.status !== "RESOLVED";
  const cancel = async () => {
    setBusy(true); setError("");
    try { await onCancel(ticket.id); setConfirming(false); }
    catch (reason) { setError(apiMessage(reason)); }
    finally { setBusy(false); }
  };
  return <div className="support-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="support-ticket-dialog" role="dialog" aria-modal="true" aria-labelledby="support-ticket-title">
      <header><div><p className="eyebrow">{t(`support.tickets.${ticket.ticket}`)} · #{ticket.id}</p><h2 id="support-ticket-title">{ticket.subject}</h2></div><button type="button" className="support-close" disabled={busy} onClick={onClose} aria-label={t("common.close")}><X size={18}/></button></header>
      <div className="support-detail-meta"><StatusBadge status={ticket.status}/><span>{ticket.createdAt ? formatDate(ticket.createdAt, { dateStyle: "medium", timeStyle: "short" }) : "—"}</span></div>
      <section className="support-detail-message"><span>{t("support.yourMessage")}</span><p>{ticket.message}</p></section>
      {ticket.adminRespone && <section className="support-admin-answer"><span><Headphones size={16}/>{t("support.teamResponse")}</span><p>{ticket.adminRespone}</p></section>}
      {error && <p className="support-inline-error"><CircleAlert size={16}/>{error}</p>}
      <footer>{canCancel && !confirming && <button type="button" className="support-cancel-button" onClick={() => setConfirming(true)}>{t("support.cancelTicket")}</button>}{confirming && <div className="support-cancel-confirm"><span>{t("support.cancelConfirm")}</span><button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirming(false)}>{t("common.cancel")}</button><button type="button" className="support-danger-button" disabled={busy} onClick={() => void cancel()}>{busy ? <LoaderCircle size={16} className="animate-spin"/> : t("support.cancelTicket")}</button></div>}<button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>{t("common.close")}</button></footer>
    </section>
  </div>;
}
