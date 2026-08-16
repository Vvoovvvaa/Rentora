"use client";

import { CheckCircle2, CircleAlert, ClipboardList, Headphones, LoaderCircle, MessageSquareText, Search, Send, Ticket, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSupportApi, apiMessage } from "@/lib/api";
import type { SupportStatus, SupportTicket } from "@/types/models";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useI18n } from "@/context/i18n-context";
import { CustomSelect } from "./custom-select";

const statuses: SupportStatus[] = ["WAITING_ADMIN", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELED"];

type Notice = { tone: "success" | "error"; message: string } | null;

function statusTone(status: SupportStatus) {
  if (status === "CLOSED" || status === "CANCELED") return "is-muted";
  if (status === "RESOLVED") return "is-success";
  if (status === "OPEN" || status === "IN_PROGRESS") return "is-active";
  return "is-waiting";
}

function AdminSupportStatus({ status }: { status: SupportStatus }) {
  const { t } = useI18n();
  return <span className={`support-status ${statusTone(status)}`}>{t(`support.statuses.${status}`)}</span>;
}

export function AdminSupportPage() {
  const { t, formatDate } = useI18n();
  const { signOut } = useAdminAuth();
  const router = useRouter();
  const [status, setStatus] = useState<SupportStatus | "">("");
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);

  const fail = useCallback((reason: unknown) => {
    const responseStatus = (reason as { response?: { status?: number } }).response?.status;
    if (responseStatus === 401) { signOut(); router.replace("/admin/login"); return; }
    setNotice({ tone: "error", message: apiMessage(reason) });
  }, [router, signOut]);
  const load = useCallback(async () => {
    setLoading(true); setNotice(null);
    try { setTickets(await (status ? adminSupportApi.byStatus(status) : adminSupportApi.all())); }
    catch (reason) { fail(reason); }
    finally { setLoading(false); }
  }, [fail, status]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const shown = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => [ticket.id, ticket.subject, ticket.message, ticket.user?.name, ticket.user?.gmail].filter(Boolean).join(" ").toLocaleLowerCase().includes(term));
  }, [query, tickets]);
  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    try { setSelected(await adminSupportApi.one(ticket.id)); }
    catch (reason) { fail(reason); }
  };
  const applied = async (message: string) => { setNotice({ tone: "success", message }); await load(); };

  return <>
    <header className="admin-page-header admin-support-header"><div><p className="eyebrow">{t("support.admin.eyebrow")}</p><h1>{t("support.admin.title")}</h1><p>{t("support.admin.subtitle")}</p></div><span className="admin-count-pill">{t("support.ticketsCount", { count: tickets.length })}</span></header>
    {notice && <p role="status" className={`admin-notice ${notice.tone === "success" ? "is-success" : "is-error"}`}>{notice.tone === "success" ? <CheckCircle2 size={16}/> : <CircleAlert size={16}/>} {notice.message}</p>}
    <section className="admin-support-toolbar"><label><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("support.admin.searchPlaceholder")}/></label><div><span>{t("support.status")}</span><CustomSelect value={status} onChange={(value) => setStatus(value as SupportStatus | "")} placeholder={t("support.admin.allStatuses")} ariaLabel={t("support.status")} options={statuses.map((value) => ({ value, label: t(`support.statuses.${value}`) }))}/></div></section>
    <section className="admin-support-list">
      <header><span>{t("support.admin.ticket")}</span><span>{t("support.admin.customer")}</span><span>{t("support.status")}</span><span>{t("support.admin.created")}</span><span/></header>
      {loading ? <div className="admin-support-loading"><LoaderCircle size={26} className="animate-spin"/>{t("common.loading")}</div> : shown.length ? shown.map((ticket) => <button type="button" key={ticket.id} onClick={() => void openTicket(ticket)}>
        <span className="admin-support-ticket"><Ticket size={18}/><span><small>#{ticket.id} · {t(`support.tickets.${ticket.ticket}`)}</small><strong>{ticket.subject}</strong><em>{ticket.message}</em></span></span>
        <span className="admin-support-user"><span>{ticket.user?.name?.slice(0, 1).toUpperCase() || "?"}</span><span><strong>{ticket.user?.name || "—"}</strong><small>{ticket.user?.gmail || "—"}</small></span></span>
        <AdminSupportStatus status={ticket.status}/><time>{ticket.createdAt ? formatDate(ticket.createdAt) : "—"}</time><MessageSquareText size={17}/>
      </button>) : <div className="admin-empty"><ClipboardList size={27}/><h2>{t("support.admin.noTickets")}</h2><p>{t("support.admin.noTicketsCopy")}</p></div>}
    </section>
    {selected && <AdminTicketDialog ticket={selected} onClose={() => setSelected(null)} onComplete={applied} onFailure={fail}/>} 
  </>;
}

function AdminTicketDialog({ ticket, onClose, onComplete, onFailure }: { ticket: SupportTicket; onClose: () => void; onComplete: (message: string) => Promise<void>; onFailure: (reason: unknown) => void }) {
  const { t, formatDate } = useI18n();
  const [response, setResponse] = useState(ticket.adminRespone || "");
  const [busy, setBusy] = useState<"accept" | "reply" | "close" | null>(null);
  const canAccept = ticket.status === "WAITING_ADMIN";
  const canClose = ticket.status !== "CLOSED" && ticket.status !== "CANCELED";
  const canReply = ticket.status !== "CLOSED" && ticket.status !== "CANCELED";
  const action = async (kind: "accept" | "reply" | "close") => {
    setBusy(kind);
    try {
      const result = kind === "accept" ? await adminSupportApi.accept(ticket.id) : kind === "close" ? await adminSupportApi.close(ticket.id) : await adminSupportApi.respond(ticket.id, response.trim());
      await onComplete(result.message || t("support.admin.updated"));
      onClose();
    } catch (reason) { onFailure(reason); }
    finally { setBusy(null); }
  };
  return <div className="admin-support-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="admin-support-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-ticket-title">
      <header><div><p className="eyebrow">{t(`support.tickets.${ticket.ticket}`)} · #{ticket.id}</p><h2 id="admin-ticket-title">{ticket.subject}</h2></div><button type="button" disabled={Boolean(busy)} onClick={onClose} aria-label={t("common.close")}><X size={18}/></button></header>
      <div className="admin-support-detail-meta"><AdminSupportStatus status={ticket.status}/><span>{ticket.createdAt ? formatDate(ticket.createdAt, { dateStyle: "medium", timeStyle: "short" }) : "—"}</span></div>
      <section className="admin-support-customer"><UserRound size={17}/><div><strong>{ticket.user?.name || "—"}</strong><span>{ticket.user?.gmail || "—"}{ticket.user?.phone ? ` · ${ticket.user.phone}` : ""}</span></div></section>
      <section className="admin-support-message"><span>{t("support.admin.customerMessage")}</span><p>{ticket.message}</p></section>
      {ticket.adminRespone && <section className="admin-support-existing-response"><span><Headphones size={15}/>{t("support.teamResponse")}</span><p>{ticket.adminRespone}</p></section>}
      {canReply && <label className="admin-support-reply"><span>{t("support.admin.reply")}</span><textarea value={response} onChange={(event) => setResponse(event.target.value)} maxLength={4000} placeholder={t("support.admin.replyPlaceholder")}/></label>}
      <footer>{canAccept && <button type="button" className="admin-action primary" disabled={Boolean(busy)} onClick={() => void action("accept")}>{busy === "accept" ? <LoaderCircle size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} {t("support.admin.accept")}</button>}{canClose && <button type="button" className="admin-action secondary" disabled={Boolean(busy)} onClick={() => void action("close")}>{busy === "close" ? <LoaderCircle size={16} className="animate-spin"/> : t("support.admin.close")}</button>}{canReply && <button type="button" className="admin-action primary" disabled={Boolean(busy) || !response.trim()} onClick={() => void action("reply")}>{busy === "reply" ? <LoaderCircle size={16} className="animate-spin"/> : <Send size={16}/>} {t("support.admin.sendReply")}</button>}</footer>
    </section>
  </div>;
}
