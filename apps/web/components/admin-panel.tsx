"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  Home,
  ImageOff,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Trash2,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  adminPropertiesApi,
  adminUsersApi,
  apiMessage,
} from "@/lib/api";

import { useAdminAuth } from "@/context/admin-auth-context";
import type { Admin, Property, User } from "@/types/models";

import {
  cityOf,
  formatMoney,
  getCategoryLabel,
  getListingLabel,
  readableEnum,
} from "./property-presentation";

import { StatusBadge } from "./status-badge";
import { RentoraLogo } from "./rentora-logo";
import { AdminSupportPage } from "./admin-support-page";
import { AdminAgenciesPage } from "./admin-agencies-page";
import { useI18n } from "@/context/i18n-context";

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

type ActionTone = "primary" | "warning" | "danger";

type AdminPropertyDeleteReason =
  | "VIOLATION_OF_RULES"
  | "FRAUD"
  | "FALSE_INFORMATION"
  | "DUPLICATE"
  | "INAPPROPRIATE_CONTENT"
  | "ILLEGAL_LISTING"
  | "USER_REQUEST"
  | "OTHER";

const propertyDeleteReasons: Array<{
  value: AdminPropertyDeleteReason;
  label: string;
}> = [
  {
    value: "VIOLATION_OF_RULES",
    label: "Violation of Rentora rules",
  },
  {
    value: "FRAUD",
    label: "Fraud or suspected scam",
  },
  {
    value: "FALSE_INFORMATION",
    label: "False or misleading information",
  },
  {
    value: "DUPLICATE",
    label: "Duplicate listing",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "Inappropriate content or photos",
  },
  {
    value: "ILLEGAL_LISTING",
    label: "Illegal or unauthorized listing",
  },
  {
    value: "USER_REQUEST",
    label: "Requested by the user",
  },
  {
    value: "OTHER",
    label: "Other reason",
  },
];

const dateOf = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(new Date(value))
    : "—";

const propertyImage = (property: Property) =>
  property.images?.[0]?.url;

const adminRoleLabel = (role: Admin["adminRole"]) =>
  role === "SUPERADMIN" ? "Super admin" : "Admin";

function useAdminFailure() {
  const router = useRouter();
  const { signOut } = useAdminAuth();

  return (reason: unknown) => {
    const status = (
      reason as {
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

    return apiMessage(reason);
  };
}

function NoticeMessage({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <p
      role="status"
      className={`admin-notice ${
        notice.tone === "success" ? "is-success" : "is-error"
      }`}
    >
      {notice.tone === "success" ? (
        <CheckCircle2 size={16} />
      ) : (
        <CircleAlert size={16} />
      )}

      {notice.text}
    </p>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "primary",
  busy,
  onCancel,
  onConfirm,
  children,
  confirmDisabled = false,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ActionTone;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-3xl border border-stone-200 bg-[#fffdf9] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Confirmation</p>

            <h2
              id="admin-confirm-title"
              className="mt-2 text-xl font-bold"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="icon-button"
            aria-label="Close confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 leading-6 text-stone-600">
          {description}
        </p>

        {children && <div className="mt-5">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`admin-action ${tone}`}
          >
            {busy && (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            )}

            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function AdminLogin() {
  const { signIn, authenticated } = useAdminAuth();
  const router = useRouter();

  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authenticated) {
      router.replace("/admin");
    }
  }, [authenticated, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await signIn(gmail, password);
      router.replace("/admin");
    } catch (reason) {
      setError(apiMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <section className="admin-login-brand">
          <RentoraLogo variant="light" size="admin" />

          <p>Admin workspace</p>

          <h1>Confident administration for every home.</h1>

          <span>
            Manage the marketplace with a secure, separate administrator
            session.
          </span>
        </section>

        <section className="admin-login-form">
          <div>
            <p className="eyebrow">Secure access</p>
            <h1>Admin sign in</h1>
            <p>Use your administrator email and password.</p>
          </div>

          <form onSubmit={submit}>
            <label>
              Administrator email

              <input
                className="field"
                type="email"
                required
                value={gmail}
                onChange={(event) => setGmail(event.target.value)}
                placeholder="admin@rentora.am"
              />
            </label>

            <label>
              Password

              <input
                className="field"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary justify-center"
            >
              {busy ? (
                <LoaderCircle
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <ShieldCheck size={18} />
              )}

              {busy ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>

          {error && (
            <NoticeMessage
              notice={{
                tone: "error",
                text: error,
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function AdminGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/admin/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50">
        <LoaderCircle
          className="animate-spin text-[#a77d54]"
          size={30}
        />
      </main>
    );
  }

  return <>{children}</>;
}

const groups = [
  {
    label: "Overview",
    links: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: Home,
        exact: true,
      },
    ],
  },
  {
    label: "Management",
    links: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        exact: false,
      },
      {
        href: "/admin/properties",
        label: "Listings",
        icon: Building2,
        exact: false,
      },
      {
        href: "/admin/agencies",
        label: "Agencies",
        icon: Building2,
        exact: false,
      },
      {
        href: "/admin/support",
        label: "Support",
        icon: MessageSquareText,
        exact: false,
      },
    ],
  },
  {
    label: "Administration",
    links: [
      {
        href: "/admin/admins",
        label: "Admins",
        icon: ShieldEllipsis,
        exact: false,
      },
      {
        href: "/admin/profile",
        label: "My profile",
        icon: UserRound,
        exact: false,
      },
    ],
  },
];

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAdminAuth();

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link
          href="/admin"
          className="admin-brand"
          aria-label="Rentora admin dashboard"
        >
          <RentoraLogo variant="light" size="admin" />
          <small>Admin workspace</small>
        </Link>

        <nav>
          {groups.map((group) => (
            <section key={group.label}>
              <p>{group.label}</p>

              {group.links.map(
                ({ href, label, icon: Icon, exact }) => {
                  const active = exact
                    ? pathname === href
                    : pathname === href ||
                      pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={active ? "is-active" : ""}
                    >
                      <Icon size={17} />
                      {label}
                    </Link>
                  );
                },
              )}
            </section>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            signOut();
            router.replace("/admin/login");
          }}
        >
          <LogOut size={17} />
          Log out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-container">{children}</div>
      </main>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </header>
  );
}

function Back({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className="back-link">
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

function Loading() {
  return (
    <div className="admin-loading">
      <LoaderCircle
        size={28}
        className="animate-spin"
      />
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<{
    users: number;
    active: number;
    pending: number;
    rejected: number;
    expired: number;
  }>();

  const [notice, setNotice] = useState<Notice>(null);
  const onFailure = useAdminFailure();

  useEffect(() => {
    Promise.all([
      adminUsersApi.all(),
      adminPropertiesApi.active(),
      adminPropertiesApi.pending(),
      adminPropertiesApi.rejected(),
      adminPropertiesApi.expired(),
    ])
      .then(([users, active, pending, rejected, expired]) => {
        setStats({
          users: users.length,
          active: active.length,
          pending: pending.length,
          rejected: rejected.length,
          expired: expired.length,
        });
      })
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      });
  }, []);

  const cards = [
    {
      label: "Users",
      copy: "Registered Rentora accounts",
      value: stats?.users,
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Active listings",
      copy: "Published properties currently available",
      value: stats?.active,
      href: "/admin/properties",
      icon: Building2,
    },
    {
      label: "Pending review",
      copy: "Listings awaiting moderation",
      value: stats?.pending,
      href: "/admin/properties/pending",
      icon: Clock3,
    },
    {
      label: "Rejected listings",
      copy: "Listings rejected during moderation",
      value: stats?.rejected,
      href: "/admin/properties/rejected",
      icon: Ban,
    },
    {
      label: "Expired listings",
      copy: "Listings past their publication period",
      value: stats?.expired,
      href: "/admin/properties/expired",
      icon: Clock3,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Rentora administration"
        title="Dashboard"
        description="A clear overview of marketplace activity and the actions that need attention."
      />

      <NoticeMessage notice={notice} />

      <section className="admin-stat-grid">
        {cards.map(({ label, copy, value, href, icon: Icon }) => (
          <Link
            href={href}
            key={label}
            className="admin-stat-card"
          >
            <span>
              <Icon size={20} />
            </span>

            <strong>{value ?? "—"}</strong>
            <h2>{label}</h2>
            <p>{copy}</p>

            <em>
              Open <ChevronRight size={15} />
            </em>
          </Link>
        ))}
      </section>

      <section className="admin-quick-actions">
        <div>
          <p className="eyebrow">Quick actions</p>
          <h2>Keep the marketplace moving</h2>
          <p>
            Review pending homes, support users, or inspect the complete
            property inventory.
          </p>
        </div>

        <div>
          {[
            {
              href: "/admin/properties/pending",
              label: "Review pending listings",
              icon: Clock3,
            },
            {
              href: "/admin/users",
              label: "Manage users",
              icon: Users,
            },
            {
              href: "/admin/properties",
              label: "View properties",
              icon: Building2,
            },
            {
              href: "/admin/agencies",
              label: "Review agency applications",
              icon: Building2,
            },
          ].map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={18} />
              {label}
              <ChevronRight size={15} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState({
    name: "",
    gmail: "",
    phone: "",
  });

  const [notice, setNotice] = useState<Notice>(null);
  const onFailure = useAdminFailure();

  const load = () => {
    setLoading(true);

    adminUsersApi
      .all()
      .then(setUsers)
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value.trim()),
    );

    if (!Object.keys(payload).length) {
      return load();
    }

    setLoading(true);

    try {
      setUsers(await adminUsersApi.search(payload));
    } catch (reason) {
      setNotice({
        tone: "error",
        text: onFailure(reason),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Account management"
        title="Users"
        description="Search and review registered accounts. Open a user to manage their access safely."
        action={
          <span className="admin-count-pill">
            {users.length} shown
          </span>
        }
      />

      <form onSubmit={search} className="admin-search">
        <label>
          <span>Name</span>

          <input
            className="field"
            value={query.name}
            onChange={(event) =>
              setQuery({ ...query, name: event.target.value })
            }
            placeholder="Search name"
          />
        </label>

        <label>
          <span>Email</span>

          <input
            className="field"
            type="email"
            value={query.gmail}
            onChange={(event) =>
              setQuery({ ...query, gmail: event.target.value })
            }
            placeholder="name@example.com"
          />
        </label>

        <label>
          <span>Phone</span>

          <input
            className="field"
            value={query.phone}
            onChange={(event) =>
              setQuery({ ...query, phone: event.target.value })
            }
            placeholder="+374…"
          />
        </label>

        <button type="submit" className="btn-primary">
          <Search size={16} />
          Search
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setQuery({
              name: "",
              gmail: "",
              phone: "",
            });

            load();
          }}
        >
          <RefreshCcw size={16} />
          Reset
        </button>
      </form>

      <NoticeMessage notice={notice} />

      <section className="admin-table-card">
        <div className="admin-table-head users">
          <span>Account</span>
          <span>Contact</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        {loading ? (
          <Loading />
        ) : users.length ? (
          users.map((user) => (
            <Link
              href={`/admin/users/${user.id}`}
              key={user.id}
              className="admin-table-row users"
            >
              <span>
                <b>{user.name}</b>
                <small>#{user.id}</small>
              </span>

              <span>
                <b>{user.gmail}</b>
                <small>{user.phone}</small>
              </span>

              <StatusBadge
                value={user.accauntStatus}
                kind="account"
              />

              <time>{dateOf(user.createdAt)}</time>
            </Link>
          ))
        ) : (
          <div className="admin-empty">
            <Users size={26} />
            <h2>No users found</h2>
            <p>Try another name, email or phone number.</p>
          </div>
        )}
      </section>
    </>
  );
}

function UserDetail({ id }: { id: number }) {
  const { t } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [action, setAction] = useState<"block" | "unblock" | null>(null);
  const [busy, setBusy] = useState(false);

  const onFailure = useAdminFailure();

  const load = () => {
    setLoading(true);

    adminUsersApi
      .one(id)
      .then(setUser)
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  const apply = async () => {
    if (!user || !action) return;

    setBusy(true);

    try {
      const result =
        action === "block"
          ? await adminUsersApi.block(id)
          : await adminUsersApi.unblock(id);

      setNotice({
        tone: "success",
        text: result.message,
      });

      setAction(null);
      load();
    } catch (reason) {
      setNotice({
        tone: "error",
        text: onFailure(reason),
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  if (!user) {
    return (
      <>
        <Back href="/admin/users" label="Back to users" />

        <NoticeMessage
          notice={
            notice || {
              tone: "error",
              text: "User not found.",
            }
          }
        />
      </>
    );
  }

  const permanentlyBlocked =
    user.accauntStatus === "PERMANETLY_BLOCK";

  const canBlock = user.accauntStatus === "ACTIVE";

  const securityRows: Array<[string, string]> = [
    ["Failed attempts", String(user.security?.totalAttemps ?? "—")],
    ["Temporary blocks", String(user.security?.temporaryBlock ?? "—")],
    [
      "Blocked until",
      user.security?.temporaryBlockUntil
        ? dateOf(user.security.temporaryBlockUntil)
        : "—",
    ],
  ];

  const profileRows: Array<[string, React.ReactNode]> = [
    ["Email", user.gmail],
    ["Phone", user.phone],
    ["Age", String(user.age)],
    [
      "Email verification",
      <StatusBadge
        value={user.gmailStatus}
        kind="verification"
        key="verified"
      />,
    ],
    ["Created", dateOf(user.createdAt)],
  ];

  return (
    <>
      <Back href="/admin/users" label="Back to users" />

      <PageHeader
        eyebrow={`Users / #${user.id}`}
        title={user.name}
        description="Profile, security and current listing information."
        action={
          <StatusBadge
            value={user.accauntStatus}
            kind="account"
          />
        }
      />

      <NoticeMessage notice={notice} />

      <div className="admin-detail-grid">
        <div className="space-y-5">
          <section className="admin-section">
            <p className="eyebrow">Profile</p>
            <h2>Account information</h2>

            <dl>
              {profileRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="admin-section">
            <p className="eyebrow">Listings</p>
            <h2>
              {user.properties?.length || 0} listed properties
            </h2>

            {user.properties?.length ? (
              <div className="admin-linked-list">
                {user.properties.map((property) => (
                  <Link
                    href={`/admin/properties/${property.id}`}
                    key={property.id}
                  >
                    <span>
                      <b>{property.title}</b>
                      <small>
                        #{property.id} · {cityOf(property.city)}
                      </small>
                    </span>

                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="admin-muted">
                This user has no listings yet.
              </p>
            )}
          </section>
        </div>

        <aside className="admin-aside">
          <section className="admin-section">
            <p className="eyebrow">Security</p>
            <h2>Account protection</h2>

            <dl>
              {securityRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="admin-action-panel">
            <p className="eyebrow">Admin action</p>

            <h2>
              {permanentlyBlocked
                ? t("errors.restoreTitle")
                : canBlock
                  ? t("errors.blockTitle")
                  : t("errors.temporaryBlockTitle")}
            </h2>

            <p>
              {permanentlyBlocked
                ? t("errors.restoreCopy")
                : canBlock
                  ? t("errors.blockCopy")
                  : t("errors.temporaryBlockCopy")}
            </p>

            {canBlock && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setAction("block")}
                className="admin-action danger"
              >
                <Ban size={16} />
                {t("errors.blockUser")}
              </button>
            )}

            {permanentlyBlocked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setAction("unblock")}
                className="admin-action primary"
              >
                <CheckCircle2 size={16} />
                {t("errors.unblockUser")}
              </button>
            )}
          </section>
        </aside>
      </div>

      {action && (
        <ConfirmDialog
          title={
            action === "block"
              ? t("errors.blockConfirmTitle")
              : t("errors.unblockConfirmTitle")
          }
          description={
            action === "block"
              ? t("errors.blockConfirmCopy")
              : t("errors.unblockConfirmCopy")
          }
          confirmLabel={
            action === "block"
              ? t("errors.blockUser")
              : t("errors.unblockUser")
          }
          tone={action === "block" ? "danger" : "primary"}
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={apply}
        />
      )}
    </>
  );
}

function PropertyCardAdmin({
  property,
  pending,
  onComplete,
}: {
  property: Property;
  pending?: boolean;
  onComplete?: (id: number, message: string) => void;
}) {
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const onFailure = useAdminFailure();

  const apply = async () => {
    if (!action) return;

    setBusy(true);

    try {
      const result =
        action === "accept"
          ? await adminPropertiesApi.accept(property.id)
          : await adminPropertiesApi.reject(property.id);

      onComplete?.(property.id, result.message);
      setAction(null);
    } catch (reason) {
      setNotice({
        tone: "error",
        text: onFailure(reason),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="admin-property-card">
      <Link href={`/admin/properties/${property.id}`}>
        <div className="admin-property-image">
          {propertyImage(property) ? (
            <img src={propertyImage(property)} alt="" />
          ) : (
            <ImageOff size={24} />
          )}
        </div>

        <div className="admin-property-body">
          <div className="admin-property-meta">
            <StatusBadge
              value={property.publishing}
              kind="publishing"
            />

            <StatusBadge
              value={property.status}
              kind="property"
            />

            <span>
              {property.listing
                ? getListingLabel(property.listing)
                : "No listing type"}
            </span>
          </div>

          <div className="admin-property-title">
            <div>
              <h2>{property.title}</h2>

              <p>
                #{property.id} · {getCategoryLabel(property.category)} ·{" "}
                {cityOf(property.city)}
              </p>
            </div>

            <strong>
              {formatMoney(property.price, property.currency)}
            </strong>
          </div>

          <div className="admin-property-facts">
            <span>
              Owner <b>{property.owner?.name || "—"}</b>
            </span>

            <span>
              <Eye size={14} /> {property.views} views
            </span>

            <span>Created {dateOf(property.createdAt)}</span>
          </div>
        </div>
      </Link>

      {pending && (
        <footer>
          <Link
            href={`/admin/properties/${property.id}`}
            className="btn-secondary"
          >
            Review <ChevronRight size={15} />
          </Link>

          <button
            type="button"
            disabled={busy}
            onClick={() => setAction("accept")}
            className="admin-action primary"
          >
            <CheckCircle2 size={16} />
            Accept
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => setAction("reject")}
            className="admin-action danger"
          >
            <Ban size={16} />
            Reject
          </button>
        </footer>
      )}

      <NoticeMessage notice={notice} />

      {action && (
        <ConfirmDialog
          title={
            action === "accept"
              ? "Accept this listing?"
              : "Reject this listing?"
          }
          description={
            action === "accept"
              ? "Publishing will become Active and the owner will receive the existing backend notification."
              : "Publishing will become Rejected and the listing will not be publicly available."
          }
          confirmLabel={
            action === "accept" ? "Accept listing" : "Reject listing"
          }
          tone={action === "accept" ? "primary" : "danger"}
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={apply}
        />
      )}
    </article>
  );
}

type PropertyListView =
  | "active"
  | "pending"
  | "rejected"
  | "expired";

function PropertiesPage({
  view = "active",
}: {
  view?: PropertyListView;
}) {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);

  const onFailure = useAdminFailure();

  const viewConfig: Record<
    PropertyListView,
    {
      title: string;
      eyebrow: string;
      description: string;
      emptyTitle: string;
      emptyCopy: string;
      load: () => Promise<Property[]>;
    }
  > = {
    active: {
      title: "Active listings",
      eyebrow: "Marketplace inventory",
      description:
        "Published properties currently available in the marketplace.",
      emptyTitle: "No active listings",
      emptyCopy:
        "There are no active properties returned by the admin API.",
      load: adminPropertiesApi.active,
    },

    pending: {
      title: "Pending listings",
      eyebrow: "Moderation workflow",
      description:
        "Review each listing and make a clear publishing decision.",
      emptyTitle: "No pending properties",
      emptyCopy:
        "The moderation queue is clear for now.",
      load: adminPropertiesApi.pending,
    },

    rejected: {
      title: "Rejected listings",
      eyebrow: "Moderation records",
      description:
        "Listings rejected during review. Inspect their details and moderation state.",
      emptyTitle: "No rejected listings",
      emptyCopy:
        "No rejected properties were returned by the admin API.",
      load: adminPropertiesApi.rejected,
    },

    expired: {
      title: "Expired listings",
      eyebrow: "Publication lifecycle",
      description:
        "Listings whose publication period has ended.",
      emptyTitle: "No expired listings",
      emptyCopy:
        "Listings will appear here after their publication period expires.",
      load: adminPropertiesApi.expired,
    },
  };

  const config = viewConfig[view];

  const load = () => {
    setLoading(true);
    setNotice(null);

    config
      .load()
      .then(setProperties)
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);

    return () => window.clearTimeout(timer);
  }, [view]);

  const complete = (id: number, text: string) => {
    setProperties((current) =>
      current.filter((property) => property.id !== id),
    );

    setNotice({
      tone: "success",
      text,
    });
  };

  return (
    <>
      <nav className="admin-listing-tabs">
        {[
          { label: "Active", href: "/admin/properties", view: "active" },
          {
            label: "Pending",
            href: "/admin/properties/pending",
            view: "pending",
          },
          {
            label: "Rejected",
            href: "/admin/properties/rejected",
            view: "rejected",
          },
          {
            label: "Expired",
            href: "/admin/properties/expired",
            view: "expired",
          },
        ].map((tab) => (
          <Link
            key={tab.view}
            href={tab.href}
            className={
              view === tab.view
                ? "admin-listing-tab is-active"
                : "admin-listing-tab"
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <span className="admin-count-pill">
            {properties.length}{" "}
            {view === "pending" ? "to review" : "listings"}
          </span>
        }
      />

      <NoticeMessage notice={notice} />

      {loading ? (
        <Loading />
      ) : properties.length > 0 ? (
        <div className="admin-property-list">
          {properties.map((property) => (
            <PropertyCardAdmin
              key={property.id}
              property={property}
              pending={view === "pending"}
              onComplete={complete}
            />
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <Clock3 size={26} />
          <h2>{config.emptyTitle}</h2>
          <p>{config.emptyCopy}</p>
        </div>
      )}
    </>
  );
}

function PropertyDetail({ id }: { id: number }) {
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);

  const [action, setAction] = useState<
    "accept" | "reject" | "archive" | "restore" | "delete" | null
  >(null);

  const [busy, setBusy] = useState(false);

  const [deleteReason, setDeleteReason] = useState<
    AdminPropertyDeleteReason | ""
  >("");

  const onFailure = useAdminFailure();

  const load = () => {
    setLoading(true);

    adminPropertiesApi
      .one(id)
      .then(setProperty)
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  const apply = async () => {
    if (!action || !property) return;

    setBusy(true);

    try {
      let result: { message: string };

      if (action === "accept") {
        result = await adminPropertiesApi.accept(id);
      } else if (action === "reject") {
        result = await adminPropertiesApi.reject(id);
      } else if (action === "archive") {
        result = await adminPropertiesApi.archive(id);
      } else if (action === "restore") {
        result = await adminPropertiesApi.restore(id);
      } else {
        if (!deleteReason) {
          setNotice({
            tone: "error",
            text: "Select a reason before deleting this property.",
          });
          return;
        }

        result = await adminPropertiesApi.delete(id, {
          reason: deleteReason,
        });
      }

      setNotice({
        tone: "success",
        text: result.message,
      });

      setAction(null);

      if (action === "delete") {
        router.replace("/admin/properties");
      } else {
        load();
      }
    } catch (reason) {
      setNotice({
        tone: "error",
        text: onFailure(reason),
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  if (!property) {
    return (
      <>
        <Back href="/admin/properties" label="Back to properties" />

        <NoticeMessage
          notice={
            notice || {
              tone: "error",
              text: "Property not found.",
            }
          }
        />
      </>
    );
  }

  const facts: Array<[string, string]> = [
    ["Category", getCategoryLabel(property.category)],
    [
      "Listing",
      getListingLabel(property.listing || undefined) || "—",
    ],
    ["City", cityOf(property.city)],
    ["Price", formatMoney(property.price, property.currency)],
    ["Rooms", String(property.rooms)],
    ["Bedrooms", String(property.bedrooms ?? "—")],
    ["Bathrooms", String(property.bathrooms ?? "—")],
    ["Area", `${property.area} m²`],
    [
      "Floor",
      property.floor == null
        ? "—"
        : `${property.floor}${
            property.totalFloors ? ` / ${property.totalFloors}` : ""
          }`,
    ],
    [
      "Condition",
      property.condition ? readableEnum(property.condition) : "—",
    ],
    [
      "Building",
      property.buildingType ? readableEnum(property.buildingType) : "—",
    ],
    ["Views", String(property.views)],
    ["Created", dateOf(property.createdAt)],
  ];

  const pending = property.publishing === "PENDING";
  const archived = property.status === "archived";

  return (
    <>
      <Back href="/admin/properties" label="Back to properties" />

      <PageHeader
        eyebrow={`Properties / #${property.id}`}
        title={property.title}
        description={`${cityOf(property.city)} · ${formatMoney(
          property.price,
          property.currency,
        )}`}
        action={
          <div className="flex gap-2">
            <StatusBadge
              value={property.publishing}
              kind="publishing"
            />

            <StatusBadge
              value={property.status}
              kind="property"
            />
          </div>
        }
      />

      <NoticeMessage notice={notice} />

      <div className="admin-detail-grid property">
        <div className="space-y-5">
          <section className="admin-gallery">
            {property.images?.length ? (
              property.images.map((image) => (
                <img src={image.url} key={image.id} alt="" />
              ))
            ) : (
              <div>
                <ImageOff size={28} />
                <span>No images provided</span>
              </div>
            )}
          </section>

          <section className="admin-section">
            <p className="eyebrow">Property information</p>
            <h2>Key details</h2>

            <dl>
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="admin-section">
            <p className="eyebrow">Description</p>
            <h2>About this listing</h2>
            <p className="admin-description">{property.description}</p>
          </section>

          <section className="admin-section">
            <p className="eyebrow">Features</p>
            <h2>Selected amenities</h2>

            {property.features?.length ? (
              <div className="admin-feature-list">
                {property.features.map((feature) => (
                  <span key={feature}>{readableEnum(feature)}</span>
                ))}
              </div>
            ) : (
              <p className="admin-muted">
                No features were provided.
              </p>
            )}
          </section>
        </div>

        <aside className="admin-aside">
          <section className="admin-section">
            <p className="eyebrow">Owner</p>
            <h2>{property.owner?.name || "Unknown owner"}</h2>

            <p className="admin-muted">
              {property.owner?.gmail || "No email"}
              <br />
              {property.owner?.phone || "No phone"}
            </p>

            {property.owner && (
              <Link
                href={`/admin/users/${property.owner.id}`}
                className="btn-secondary mt-4"
              >
                View user <ChevronRight size={15} />
              </Link>
            )}
          </section>

          <section className="admin-action-panel">
            <p className="eyebrow">Moderation & actions</p>

            <h2>
              {pending ? "Decision required" : "Property controls"}
            </h2>

            <p>
              {pending
                ? "Review the information, then accept or reject the listing."
                : "Actions are shown only when they apply to the current property state."}
            </p>

            {pending && (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setAction("accept")}
                  className="admin-action primary"
                >
                  <CheckCircle2 size={16} />
                  Accept listing
                </button>

                <button
                  type="button"
                  onClick={() => setAction("reject")}
                  className="admin-action danger"
                >
                  <Ban size={16} />
                  Reject listing
                </button>
              </div>
            )}

            {!archived ? (
              <button
                type="button"
                onClick={() => setAction("archive")}
                className="admin-action warning"
              >
                <Archive size={16} />
                Archive property
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAction("restore")}
                className="admin-action secondary"
              >
                <RefreshCcw size={16} />
                Restore property
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDeleteReason("");
                setAction("delete");
              }}
              className="admin-action danger subtle"
            >
              <Trash2 size={16} />
              Delete property
            </button>
          </section>
        </aside>
      </div>

      {action && (
        <ConfirmDialog
          title={
            action === "accept"
              ? "Accept this listing?"
              : action === "reject"
                ? "Reject this listing?"
                : action === "archive"
                  ? "Archive this property?"
                  : action === "restore"
                    ? "Restore this property?"
                    : "Delete this property permanently?"
          }
          description={
            action === "accept"
              ? "The property publishing state will become Active."
              : action === "reject"
                ? "The property publishing state will become Rejected."
                : action === "archive"
                  ? "The property status will become Archived."
                  : action === "restore"
                    ? "The property status will become Active."
                    : "This will permanently remove the property and related images."
          }
          confirmLabel={
            action === "accept"
              ? "Accept listing"
              : action === "reject"
                ? "Reject listing"
                : action === "archive"
                  ? "Archive property"
                  : action === "restore"
                    ? "Restore property"
                    : "Delete property"
          }
          tone={
            action === "reject" || action === "delete"
              ? "danger"
              : action === "archive"
                ? "warning"
                : "primary"
          }
          confirmDisabled={action === "delete" && !deleteReason}
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={apply}
        >
          {action === "delete" && (
            <div className="space-y-2">
              <label
                htmlFor="property-delete-reason"
                className="block text-sm font-semibold text-stone-800"
              >
                Reason for deleting this listing{" "}
                <span className="text-red-600">*</span>
              </label>

              <select
                id="property-delete-reason"
                className="field w-full"
                value={deleteReason}
                onChange={(event) =>
                  setDeleteReason(
                    event.target.value as AdminPropertyDeleteReason | "",
                  )
                }
                required
                disabled={busy}
              >
                <option value="">Select a reason</option>

                {propertyDeleteReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>

              <p className="text-xs leading-5 text-stone-500">
                This reason will be saved in the deletion audit log. The deletion is permanent.
              </p>
            </div>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}

function AdminProfile() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const onFailure = useAdminFailure();

  useEffect(() => {
    let mounted = true;

    adminUsersApi
      .me()
      .then((value) => {
        if (mounted) setAdmin(value);
      })
      .catch((reason) => {
        if (mounted) {
          setNotice({
            tone: "error",
            text: onFailure(reason),
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!admin && !notice) return <Loading />;
  if (!admin) return <NoticeMessage notice={notice} />;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="My profile"
        description="Your administrator identity and role, returned by the protected admin endpoint."
      />

      <section className="admin-profile-card">
        <span>{admin.name.slice(0, 1).toUpperCase()}</span>

        <div>
          <h2>{admin.name}</h2>
          <p>{admin.gmail}</p>

          <StatusBadge
            value={admin.adminRole}
            label={adminRoleLabel(admin.adminRole)}
            kind="role"
          />
        </div>

        <dl>
          <div>
            <dt>Created</dt>
            <dd>{dateOf(admin.createdAt)}</dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>{dateOf(admin.updatedAt)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function AdminsPage({ id }: { id?: number }) {
  const [profile, setProfile] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [detail, setDetail] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [target, setTarget] = useState<Admin | null>(null);
  const [busy, setBusy] = useState(false);

  const onFailure = useAdminFailure();

  const load = () => {
    setLoading(true);

    Promise.all([
      adminUsersApi.me(),
      id ? adminUsersApi.oneAdmin(id) : adminUsersApi.admins(),
    ])
      .then(([me, data]) => {
        setProfile(me);

        if (Array.isArray(data)) {
          setAdmins(data);
        } else {
          setDetail(data);
        }
      })
      .catch((reason) => {
        setNotice({
          tone: "error",
          text: onFailure(reason),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  const remove = async () => {
    if (!target) return;

    setBusy(true);

    try {
      const result = await adminUsersApi.deleteAdmin(target.id);

      setAdmins((current) =>
        current.filter((admin) => admin.id !== target.id),
      );

      setNotice({
        tone: "success",
        text: result.message,
      });

      setTarget(null);
    } catch (reason) {
      setNotice({
        tone: "error",
        text: onFailure(reason),
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  if (id) {
    if (!detail) {
      return (
        <>
          <Back href="/admin/admins" label="Back to admins" />

          <NoticeMessage
            notice={
              notice || {
                tone: "error",
                text: "Admin not found.",
              }
            }
          />
        </>
      );
    }

    return (
      <>
        <Back href="/admin/admins" label="Back to admins" />

        <PageHeader
          eyebrow={`Admins / #${detail.id}`}
          title={detail.name}
          description={detail.gmail}
          action={
            <StatusBadge
              value={detail.adminRole}
              label={adminRoleLabel(detail.adminRole)}
              kind="role"
            />
          }
        />

        <section className="admin-profile-card">
          <span>{detail.name.slice(0, 1).toUpperCase()}</span>

          <div>
            <h2>{detail.name}</h2>
            <p>{detail.gmail}</p>
          </div>

          <dl>
            <div>
              <dt>Created</dt>
              <dd>{dateOf(detail.createdAt)}</dd>
            </div>

            <div>
              <dt>Updated</dt>
              <dd>{dateOf(detail.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Admins"
        description="Administrator accounts are controlled by backend role rules. Only a Super admin can remove another admin."
        action={
          profile ? (
            <StatusBadge
              value={profile.adminRole}
              label={`Signed in: ${adminRoleLabel(profile.adminRole)}`}
              kind="role"
            />
          ) : undefined
        }
      />

      <NoticeMessage notice={notice} />

      <section className="admin-table-card">
        <div className="admin-table-head admins">
          <span>Administrator</span>
          <span>Role</span>
          <span>Created</span>
          <span />
        </div>

        {admins.length ? (
          admins.map((admin) => (
            <div
              key={admin.id}
              className="admin-table-row admins"
            >
              <Link href={`/admin/admins/${admin.id}`}>
                <b>{admin.name}</b>
                <small>
                  #{admin.id} · {admin.gmail}
                </small>
              </Link>

              <StatusBadge
                value={admin.adminRole}
                label={adminRoleLabel(admin.adminRole)}
                kind="role"
              />

              <time>{dateOf(admin.createdAt)}</time>

              {profile?.adminRole === "SUPERADMIN" &&
              profile.id !== admin.id ? (
                <button
                  type="button"
                  onClick={() => setTarget(admin)}
                  className="admin-icon-danger"
                  aria-label={`Delete ${admin.name}`}
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <span />
              )}
            </div>
          ))
        ) : (
          <div className="admin-empty">
            <UserCog size={26} />
            <h2>No admins found</h2>
          </div>
        )}
      </section>

      {target && (
        <ConfirmDialog
          title={`Delete ${target.name}?`}
          description="This permanently removes the administrator account. Backend role rules will be enforced."
          confirmLabel="Delete admin"
          tone="danger"
          busy={busy}
          onCancel={() => setTarget(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function AdminRouter() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);

  if (path === "/admin/login") {
    return <AdminLogin />;
  }

  let content: React.ReactNode = (
    <div className="admin-empty">
      <h2>Admin page not found</h2>
    </div>
  );

  if (path === "/admin") {
    content = <Dashboard />;
  } else if (path === "/admin/users") {
    content = <UsersPage />;
  } else if (
    parts[1] === "users" &&
    /^\d+$/.test(parts[2] || "")
  ) {
    content = <UserDetail id={Number(parts[2])} />;
  } else if (path === "/admin/properties/pending") {
    content = <PropertiesPage view="pending" />;
  } else if (path === "/admin/properties/rejected") {
    content = <PropertiesPage view="rejected" />;
  } else if (path === "/admin/properties/expired") {
    content = <PropertiesPage view="expired" />;
  } else if (path === "/admin/properties") {
    content = <PropertiesPage view="active" />;
  } else if (
    parts[1] === "properties" &&
    /^\d+$/.test(parts[2] || "")
  ) {
    content = <PropertyDetail id={Number(parts[2])} />;
  } else if (path === "/admin/agencies") {
    content = <AdminAgenciesPage />;
  } else if (path === "/admin/support") {
    content = <AdminSupportPage />;
  } else if (path === "/admin/profile") {
    content = <AdminProfile />;
  } else if (path === "/admin/admins") {
    content = <AdminsPage />;
  } else if (
    parts[1] === "admins" &&
    /^\d+$/.test(parts[2] || "")
  ) {
    content = <AdminsPage id={Number(parts[2])} />;
  }

  return (
    <AdminGate>
      <AdminLayout>{content}</AdminLayout>
    </AdminGate>
  );
}

export function AdminPanel() {
  return <AdminRouter />;
}