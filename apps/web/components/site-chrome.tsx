"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Heart,
  House,
  LayoutGrid,
  LogIn,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Plus,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { agencyApi } from "@/lib/api";
import { queryWithSearchParams } from "@/lib/property-search";

import { RentoraLogo } from "./rentora-logo";

const isActive = (path: string, href: string) =>
  href === "/properties"
    ? path === "/properties" ||
    path.startsWith("/properties/") ||
    path === "/search"
    : path === href || path.startsWith(`${href}/`);

type AgencyMenuState = "checking" | "exists" | "missing" | "error";

function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const options = [
    {
      value: "en" as const,
      flag: "/flags/gb.svg",
      label: t("language.english"),
    },
    {
      value: "ru" as const,
      flag: "/flags/ru.svg",
      label: t("language.russian"),
    },
    {
      value: "am" as const,
      flag: "/flags/am.svg",
      label: t("language.armenian"),
    },
  ];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        root.current &&
        !root.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`language-selector ${compact ? "language-selector-mobile" : ""
        }`}
    >
      <button
        type="button"
        className="language-selector-trigger"
        aria-label={t("language.label")}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);

            window.setTimeout(
              () =>
                root.current
                  ?.querySelector<HTMLButtonElement>(
                    "[role='menuitemradio']",
                  )
                  ?.focus(),
              0,
            );
          }
        }}
      >
        <LanguageFlag
          src={
            options.find((option) => option.value === locale)?.flag ??
            "/flags/gb.svg"
          }
        />

        <ChevronDown size={13} />
      </button>

      {isOpen && (
        <div
          className="language-selector-menu"
          role="menu"
          aria-label={t("language.label")}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);

              root.current
                ?.querySelector<HTMLButtonElement>(
                  ".language-selector-trigger",
                )
                ?.focus();
            }
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={locale === option.value}
              className={
                locale === option.value ? "is-active" : ""
              }
              onClick={() => {
                setLocale(option.value);
                setIsOpen(false);
              }}
            >
              <LanguageFlag src={option.flag} />

              <span>{option.label}</span>

              {locale === option.value && (
                <span className="language-selector-check">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageFlag({ src }: { src: string }) {
  return (
    <span className="language-selector-flag" aria-hidden="true">
      <Image src={src} alt="" width={20} height={14} />
    </span>
  );
}

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();

  const pathname = usePathname();
  const params = useSearchParams();

  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authOptionsOpen, setAuthOptionsOpen] = useState(false);

  const accountMenuRoot = useRef<HTMLDivElement>(null);
  const authOptionsRoot = useRef<HTMLDivElement>(null);

  const [agencyState, setAgencyState] =
    useState<AgencyMenuState>("checking");

  // Close dropdowns when navigating to another page.
  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    setAuthOptionsOpen(false);
  }, [pathname]);

  // Do not leave an account dropdown open after auth changes.
  useEffect(() => {
    if (loading || !user) {
      setAccountOpen(false);
    }

    setAuthOptionsOpen(false);
  }, [loading, user?.id]);

  // Close desktop dropdowns on outside click or Escape.
  useEffect(() => {
    if (!accountOpen && !authOptionsOpen) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        accountOpen &&
        accountMenuRoot.current &&
        !accountMenuRoot.current.contains(target)
      ) {
        setAccountOpen(false);
      }

      if (
        authOptionsOpen &&
        authOptionsRoot.current &&
        !authOptionsRoot.current.contains(target)
      ) {
        setAuthOptionsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setAccountOpen(false);
      setAuthOptionsOpen(false);

      if (authOptionsOpen) {
        authOptionsRoot.current
          ?.querySelector<HTMLButtonElement>(
            ".auth-choice-trigger",
          )
          ?.focus();
      } else {
        accountMenuRoot.current
          ?.querySelector<HTMLButtonElement>(
            ".account-menu-trigger",
          )
          ?.focus();
      }
    };

    document.addEventListener(
      "pointerdown",
      closeOnOutsidePointer,
    );

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeOnOutsidePointer,
      );

      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [accountOpen, authOptionsOpen]);

  // Lock background scrolling while the mobile navigation is open.
  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.dataset.mobileMenuOpen = "true";

    return () => {
      delete document.body.dataset.mobileMenuOpen;
    };
  }, [open]);

  const agencyRefreshKey =
    pathname === "/my-agency" ||
      pathname === "/agency/create" ||
      pathname === "/profile"
      ? pathname
      : "";

  // Determine whether the current user already has an agency.
  useEffect(() => {
    let active = true;

    if (!user) {
      setAgencyState("missing");

      return () => {
        active = false;
      };
    }

    setAgencyState("checking");

    agencyApi
      .mine()
      .then(() => {
        if (active) {
          setAgencyState("exists");
        }
      })
      .catch((reason) => {
        if (!active) {
          return;
        }

        const status = (
          reason as { response?: { status?: number } }
        ).response?.status;

        if (status === 404) {
          setAgencyState("missing");
        } else {
          setAgencyState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id, agencyRefreshKey]);

  const filters = queryWithSearchParams(params).toString();

  const mapHref = `/map${filters ? `?${filters}` : ""}`;

  const exploreHref =
    pathname === "/map"
      ? `/search${filters ? `?${filters}` : ""}`
      : "/properties";

  const links = [
    {
      href: exploreHref,
      label: t("navigation.explore"),
      icon: House,
      section: "explore",
    },
    {
      href: mapHref,
      label: t("navigation.map"),
      icon: Map,
      section: "map",
    },
    {
      href: "/favorites",
      label: t("navigation.saved"),
      icon: Heart,
      section: "saved",
    },
    {
      href: "/messages",
      label: t("navigation.messages"),
      icon: MessageCircle,
      section: "messages",
    },
  ];

  const accountLinks = [
    {
      href: "/profile",
      label: t("navigation.profile"),
      icon: UserRound,
    },
    {
      href: "/my-properties",
      label: t("navigation.myListings"),
      icon: LayoutGrid,
    },
    {
      href: "/favorites",
      label: t("navigation.savedHomes"),
      icon: Heart,
    },
    {
      href: "/messages",
      label: t("navigation.messages"),
      icon: MessageCircle,
    },
    {
      href: "/support",
      label: t("navigation.support"),
      icon: CircleHelp,
    },
    {
      href: "/subscription",
      label: t("subscription.managePlan"),
      icon: CreditCard,
    },
  ];

  const agencyLabel =
    agencyState === "missing"
      ? t("agency.create")
      : t("agency.myAgency");

  const agencyChecking = agencyState === "checking";

  const handleSignOut = () => {
    setAccountOpen(false);
    setOpen(false);
    void signOut();
  };

  const handleAuthNavigation = () => {
    setAuthOptionsOpen(false);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dfd4] bg-[#fbf9f5]/90 backdrop-blur-xl">
      <div className="shell flex min-h-[88px] items-center justify-between py-4">
        <Link href="/" aria-label="Rentora home">
          <RentoraLogo variant="header" size="nav" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 rounded-2xl border border-stone-200/80 bg-white/70 p-1 xl:flex">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.section}
                href={link.href}
                className={`nav-link ${isActive(
                  pathname,
                  link.section === "explore"
                    ? "/properties"
                    : link.href,
                )
                  ? "is-active"
                  : ""
                  }`}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 xl:flex">
          <LanguageSelector />

          <Link
            href="/properties/create"
            className="btn-secondary gap-1.5 px-3 py-2 text-xs"
          >
            <Plus size={15} />
            {t("navigation.addListing")}
          </Link>

          {loading ? (
            // Avoid showing the wrong account state during initialization.
            <div
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#eee5da] px-3"
              role="status"
              aria-label="Loading account"
            >
              <span className="h-7 w-7 animate-pulse rounded-lg bg-stone-200" />
              <span className="h-2 w-12 animate-pulse rounded-full bg-stone-200" />
            </div>
          ) : user ? (
            // Authenticated user menu.
            <div className="relative" ref={accountMenuRoot}>
              <button
                type="button"
                onClick={() =>
                  setAccountOpen((value) => !value)
                }
                className={`account-menu-trigger ${accountOpen ? "is-open" : ""
                  }`}
                aria-label={
                  user.name || t("navigation.profile")
                }
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ead8bd] text-[#513f30]">
                  <UserRound size={16} />
                </span>

                <span className="max-w-24 truncate text-sm font-bold text-stone-700">
                  {user.name || t("navigation.profile")}
                </span>

                <ChevronDown size={15} />
              </button>

              {accountOpen && (
                <div
                  className="account-menu !min-w-[270px]"
                  role="menu"
                  aria-label={t("navigation.profile")}
                >
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <UserRound size={15} />
                    {t("navigation.profile")}
                  </Link>

                  <div
                    className="my-1 h-px bg-[#eee5da]"
                    aria-hidden="true"
                  />

                  <Link
                    href={
                      agencyState === "missing"
                        ? "/agency/create"
                        : "/my-agency"
                    }
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    aria-current={
                      pathname === "/my-agency" ||
                        pathname === "/agency/create"
                        ? "page"
                        : undefined
                    }
                  >
                    <Building2 size={15} />
                    {agencyChecking
                      ? t("agency.myAgency")
                      : agencyLabel}
                  </Link>

                  {accountLinks.slice(1).map(
                    ({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    ),
                  )}

                  <div
                    className="my-1 h-px bg-[#eee5da]"
                    aria-hidden="true"
                  />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    <LogOut size={15} />
                    {t("navigation.logOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Guest menu: choose sign-in or account creation.
            <div className="relative" ref={authOptionsRoot}>
              <button
                type="button"
                className="auth-choice-trigger btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
                onClick={() =>
                  setAuthOptionsOpen((value) => !value)
                }
                aria-haspopup="menu"
                aria-expanded={authOptionsOpen}
              >
                <LogIn size={15} />

                <span>
                  {t("auth.signIn")} / {t("navigation.createAccount")}
                </span>

                <ChevronDown size={14} />
              </button>

              {authOptionsOpen && (
                <div
                  className="account-menu !min-w-[220px]"
                  role="menu"
                  aria-label={`${t("auth.signIn")} / ${t("navigation.createAccount")}`}
                >
                  <Link
                    href="/login"
                    role="menuitem"
                    onClick={handleAuthNavigation}
                  >
                    <LogIn size={15} />
                    {t("auth.signIn")}
                  </Link>

                  <Link
                    href="/register"
                    role="menuitem"
                    onClick={handleAuthNavigation}
                  >
                    <UserPlus size={15} />
                    {t("navigation.createAccount")}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1ece4] xl:hidden"
          aria-label={
            open ? t("common.close") : t("navigation.explore")
          }
          aria-expanded={open}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div
          className="mobile-navigation-backdrop xl:hidden"
          onMouseDown={() => setOpen(false)}
        >
          <nav
            className="mobile-navigation-sheet shell"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mobile-navigation-sheet-head">
              <span>{t("navigation.explore")}</span>
              <LanguageSelector compact />
            </div>

            {links.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.section}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`nav-link mobile ${isActive(
                    pathname,
                    link.section === "explore"
                      ? "/properties"
                      : link.href,
                  )
                    ? "is-active"
                    : ""
                    }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}

            {loading ? (
              <div
                className="flex items-center gap-3 rounded-xl border border-[#eee5da] bg-white px-3 py-3"
                role="status"
                aria-label="Loading account"
              >
                <span className="h-8 w-8 animate-pulse rounded-lg bg-stone-200" />
                <span className="h-2 w-14 animate-pulse rounded-full bg-stone-200" />
              </div>
            ) : user ? (
              <>
                <Link
                  href="/properties/create"
                  onClick={() => setOpen(false)}
                  className="nav-link mobile"
                >
                  <Plus size={16} />
                  {t("navigation.addListing")}
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="nav-link mobile"
                >
                  <UserRound size={16} />
                  {t("navigation.profile")}
                </Link>

                <Link
                  href={
                    agencyState === "missing"
                      ? "/agency/create"
                      : "/my-agency"
                  }
                  onClick={() => setOpen(false)}
                  className="nav-link mobile"
                  aria-current={
                    pathname === "/my-agency" ||
                      pathname === "/agency/create"
                      ? "page"
                      : undefined
                  }
                >
                  <Building2 size={16} />
                  {agencyChecking
                    ? t("agency.myAgency")
                    : agencyLabel}
                </Link>

                <Link
                  href="/my-properties"
                  onClick={() => setOpen(false)}
                  className="nav-link mobile"
                >
                  <LayoutGrid size={16} />
                  {t("navigation.myListings")}
                </Link>

                <Link
                  href="/support"
                  onClick={() => setOpen(false)}
                  className="nav-link mobile"
                >
                  <CircleHelp size={16} />
                  {t("navigation.support")}
                </Link>

                <button
                  type="button"
                  className="nav-link mobile text-rose-700"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  {t("navigation.logOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={handleAuthNavigation}
                  className="nav-link mobile"
                >
                  <LogIn size={16} />
                  {t("auth.signIn")}
                </Link>

                <Link
                  href="/register"
                  onClick={handleAuthNavigation}
                  className="nav-link mobile"
                >
                  <UserPlus size={16} />
                  {t("navigation.createAccount")}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-[#e7dfd4] bg-[#fbf9f5]">
      <div className="shell flex flex-col gap-5 py-12 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="Rentora home">
          <RentoraLogo size="footer" />
        </Link>

        <p>{t("navigation.rentoraTagline")}</p>

        <div className="flex gap-5">
          <Link href="/properties">
            {t("navigation.homes")}
          </Link>

          <Link href="/messages">
            {t("navigation.messages")}
          </Link>

          <Link
            href="/favorites"
            className="flex items-center gap-1"
          >
            <Heart size={14} />
            {t("navigation.saved")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isMapWorkspace =
    pathname === "/map" ||
    pathname === "/my-properties/map";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="min-h-0 flex-1">
        {children}
      </main>

      {!isMapWorkspace && <Footer />}
    </div>
  );
}