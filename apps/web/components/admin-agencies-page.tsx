"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  adminAgenciesApi,
  apiMessage,
  type AdminAgency,
} from "@/lib/api";

import { useAdminAuth } from "@/context/admin-auth-context";

type Tab = "pending" | "verified" | "rejected";

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

type AgencyAction =
  | {
      type: "approve" | "reject" | "delete";
      agency: AdminAgency;
    }
  | null;

const dateOf = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
};

export function AdminAgenciesPage() {
  const router = useRouter();

  const { signOut } = useAdminAuth();

  const [tab, setTab] = useState<Tab>("pending");

  const [pending, setPending] = useState<AdminAgency[]>([]);
  const [verified, setVerified] = useState<AdminAgency[]>([]);
  const [rejected, setRejected] = useState<AdminAgency[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState<Notice>(null);

  const [action, setAction] = useState<AgencyAction>(null);
  const [reason, setReason] = useState("");

  const onFailure = useCallback(
    (error: unknown) => {
      const status = (
        error as {
          response?: {
            status?: number;
          };
        }
      ).response?.status;

      if (status === 401) {
        signOut();
        router.replace("/admin/login");

        return "Your administrator session has expired. Please sign in again.";
      }

      return apiMessage(error);
    },
    [router, signOut],
  );

  const loadAgencies = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const [
          pendingAgencies,
          verifiedAgencies,
          rejectedAgencies,
        ] = await Promise.all([
          adminAgenciesApi.pending(),
          adminAgenciesApi.verified(),
          adminAgenciesApi.rejected(),
        ]);

        setPending(pendingAgencies);
        setVerified(verifiedAgencies);
        setRejected(rejectedAgencies);
      } catch (error) {
        setNotice({
          tone: "error",
          text: onFailure(error),
        });
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [onFailure],
  );

  useEffect(() => {
    void loadAgencies();
  }, [loadAgencies]);

  const displayedAgencies =
    tab === "pending"
      ? pending
      : tab === "verified"
        ? verified
        : rejected;

  const confirmAction = async () => {
    if (!action || busy) {
      return;
    }

    const needsReason =
      action.type === "reject" ||
      action.type === "delete";

    if (needsReason && !reason.trim()) {
      setNotice({
        tone: "error",
        text: "Please enter a reason before continuing.",
      });

      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      let result: { message: string };

      if (action.type === "approve") {
        result = await adminAgenciesApi.approve(
          action.agency.id,
        );
      } else if (action.type === "reject") {
        result = await adminAgenciesApi.reject(
          action.agency.id,
          reason.trim(),
        );
      } else {
        result = await adminAgenciesApi.remove(
          action.agency.id,
          reason.trim(),
        );
      }

      setAction(null);
      setReason("");

      setNotice({
        tone: "success",
        text: result.message,
      });

      await loadAgencies(false);
    } catch (error) {
      setNotice({
        tone: "error",
        text: onFailure(error),
      });
    } finally {
      setBusy(false);
    }
  };

  const openAction = (
    type: "approve" | "reject" | "delete",
    agency: AdminAgency,
  ) => {
    setReason("");
    setNotice(null);
    setAction({ type, agency });
  };

  const closeAction = () => {
    if (busy) return;

    setAction(null);
    setReason("");
  };

  const tabs: {
    id: Tab;
    label: string;
    count: number;
    icon: typeof Building2;
  }[] = [
    {
      id: "pending",
      label: "Pending review",
      count: pending.length,
      icon: Clock3,
    },
    {
      id: "verified",
      label: "Verified",
      count: verified.length,
      icon: BadgeCheck,
    },
    {
      id: "rejected",
      label: "Rejected",
      count: rejected.length,
      icon: XCircle,
    },
  ];

  return (
    <section className="space-y-6">
      {/* PAGE HEADER */}

      <header className="admin-page-header">
        <div>
          <p className="eyebrow">
            Marketplace management
          </p>

          <h1>Agencies</h1>

          <p>
            Review agency applications, manage verification,
            and keep the marketplace trustworthy.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() => void loadAgencies()}
        >
          {loading ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
          ) : (
            <RefreshCcw size={16} />
          )}

          Refresh
        </button>
      </header>

      {/* NOTIFICATION */}

      {notice && (
        <div
          role="status"
          className={`admin-notice ${
            notice.tone === "success"
              ? "is-success"
              : "is-error"
          }`}
        >
          {notice.tone === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <CircleAlert size={17} />
          )}

          <span>{notice.text}</span>

          <button
            type="button"
            className="ml-auto"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Awaiting review",
            value: pending.length,
            description: "Applications that need a decision",
            icon: Clock3,
            color: "text-amber-700",
            bg: "bg-amber-50",
          },
          {
            label: "Verified agencies",
            value: verified.length,
            description: "Agencies approved for the marketplace",
            icon: ShieldCheck,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Rejected applications",
            value: rejected.length,
            description: "Applications with a recorded rejection",
            icon: XCircle,
            color: "text-rose-700",
            bg: "bg-rose-50",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-stone-200 bg-[#fffdf9] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-500">
                    {item.label}
                  </p>

                  <strong className="mt-2 block text-3xl font-extrabold tracking-tight text-stone-900">
                    {loading ? "—" : item.value}
                  </strong>
                </div>

                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${item.bg} ${item.color}`}
                >
                  <Icon size={21} />
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-stone-500">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>

      {/* TABS */}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-[#fffdf9] p-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                active
                  ? "bg-[#4b382a] text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              <Icon size={16} />

              {item.label}

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/15 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* AGENCIES LIST */}

      {loading ? (
        <div className="admin-loading">
          <LoaderCircle
            size={28}
            className="animate-spin"
          />
        </div>
      ) : displayedAgencies.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          {displayedAgencies.map((agency) => (
            <article
              key={agency.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-[#fffdf9] shadow-sm transition hover:shadow-md"
            >
              {/* CARD HEADER */}

              <div className="flex gap-4 border-b border-stone-100 p-5">
                <div className="grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  {agency.image?.url ? (
                    <img
                      src={agency.image.url}
                      alt={`${agency.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2
                      size={28}
                      className="text-stone-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-stone-400">
                      #{agency.id}
                    </span>

                    {tab === "pending" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800">
                        Pending review
                      </span>
                    ) : tab === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-800">
                        <XCircle size={12} />
                        Rejected
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 break-words text-lg font-extrabold tracking-tight text-stone-900">
                    {agency.name}
                  </h2>

                  <p className="mt-1 text-xs text-stone-500">
                    Submitted {dateOf(agency.createdAt)}
                  </p>
                </div>
              </div>

              {/* DETAILS */}

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Mail
                      size={16}
                      className="mt-0.5 shrink-0 text-stone-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-stone-700">
                        {agency.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-2.5">
                    <Phone
                      size={16}
                      className="mt-0.5 shrink-0 text-stone-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                        Phone
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-stone-700">
                        {agency.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-2.5 sm:col-span-2">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-stone-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                        Address
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-stone-700">
                        {agency.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-2 break-all text-sm font-bold text-[#8c623b] hover:text-[#553a25]"
                  >
                    <ExternalLink
                      size={15}
                      className="shrink-0"
                    />

                    {agency.website}
                  </a>
                )}

                {agency.description && (
                  <div className="rounded-xl bg-stone-50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-stone-600">
                      {agency.description}
                    </p>
                  </div>
                )}

                {agency.owner && (
                  <div className="rounded-xl border border-stone-200 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                      Agency owner
                    </p>

                    <p className="mt-1 text-sm font-bold text-stone-800">
                      {agency.owner.name}
                    </p>

                    <p className="mt-1 break-all text-xs text-stone-500">
                      {agency.owner.gmail}
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      {agency.owner.phone}
                    </p>
                  </div>
                )}

                {tab === "rejected" &&
                  agency.verificationRejectionReason && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                      <p className="flex items-center gap-2 text-xs font-extrabold text-rose-800">
                        <CircleAlert size={15} />
                        Rejection reason
                      </p>

                      <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-rose-900">
                        {agency.verificationRejectionReason}
                      </p>
                    </div>
                  )}
              </div>

              {/* ACTIONS */}

              <footer className="flex flex-wrap gap-2 border-t border-stone-100 bg-stone-50/70 p-4">
                {(tab === "pending" ||
                  tab === "rejected") && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        openAction("approve", agency)
                      }
                      className="admin-action primary"
                    >
                      <CheckCircle2 size={16} />
                      Approve agency
                    </button>

                    {tab === "pending" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          openAction("reject", agency)
                        }
                        className="admin-action danger"
                      >
                        <XCircle size={16} />
                        Reject application
                      </button>
                    )}
                  </>
                )}

                {tab === "verified" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      openAction("delete", agency)
                    }
                    className="admin-action danger"
                  >
                    <Trash2 size={16} />
                    Delete agency
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          {tab === "pending" ? (
            <Clock3 size={28} />
          ) : tab === "verified" ? (
            <ShieldCheck size={28} />
          ) : (
            <XCircle size={28} />
          )}

          <h2>
            {tab === "pending"
              ? "No agencies awaiting review"
              : tab === "verified"
                ? "No verified agencies"
                : "No rejected applications"}
          </h2>

          <p>
            {tab === "pending"
              ? "New agency applications will appear here."
              : tab === "verified"
                ? "Approved agencies will appear here."
                : "Rejected applications with a recorded reason will appear here."}
          </p>

          {tab === "pending" && (
            <Sparkles
              size={16}
              className="mt-1 text-[#a77d54]"
            />
          )}
        </div>
      )}

      {/* ACTION DIALOG */}

      {action && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="agency-action-title"
            className="w-full max-w-lg rounded-3xl border border-stone-200 bg-[#fffdf9] p-6 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Agency moderation
                </p>

                <h2
                  id="agency-action-title"
                  className="mt-2 text-xl font-extrabold tracking-tight text-stone-900"
                >
                  {action.type === "approve"
                    ? "Approve this agency?"
                    : action.type === "reject"
                      ? "Reject this application?"
                      : "Delete this agency?"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAction}
                disabled={busy}
                className="icon-button"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </header>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              {action.type === "approve"
                ? `Approve "${action.agency.name}"? The agency will become verified and its previous rejection reason will be cleared.`
                : action.type === "reject"
                  ? `Reject "${action.agency.name}"? Enter a clear explanation that the applicant can understand.`
                  : `Permanently delete "${action.agency.name}"? Enter the reason for the administrative record.`}
            </p>

            {action.type !== "approve" && (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-stone-700">
                  {action.type === "reject"
                    ? "Reason for rejection"
                    : "Reason for deletion"}
                </span>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  rows={4}
                  maxLength={2000}
                  required
                  autoFocus
                  placeholder={
                    action.type === "reject"
                      ? "Explain what information needs to be corrected..."
                      : "Explain why this agency is being deleted..."
                  }
                  className="field min-h-28 w-full resize-y"
                />

                <span className="mt-1 block text-right text-xs text-stone-400">
                  {reason.length}/2000
                </span>
              </label>
            )}

            <footer className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={closeAction}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  busy ||
                  (action.type !== "approve" &&
                    !reason.trim())
                }
                onClick={() => void confirmAction()}
                className={`admin-action ${
                  action.type === "approve"
                    ? "primary"
                    : "danger"
                }`}
              >
                {busy ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : action.type === "approve" ? (
                  <CheckCircle2 size={16} />
                ) : action.type === "reject" ? (
                  <XCircle size={16} />
                ) : (
                  <Trash2 size={16} />
                )}

                {busy
                  ? "Working…"
                  : action.type === "approve"
                    ? "Approve agency"
                    : action.type === "reject"
                      ? "Reject application"
                      : "Delete agency"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}