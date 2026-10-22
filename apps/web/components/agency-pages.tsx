"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  Eye,
  Globe2,
  ImagePlus,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { agencyApi, apiMessage, propertiesApi } from "@/lib/api";
import type { Agency, Property } from "@/types/models";
import { useI18n } from "@/context/i18n-context";

import { PropertyCard } from "./property-card";
import { isPublicProperty } from "./property-presentation";
import { AgencyLogo, AgencyVerified } from "./agency-brand";
import styles from "./agency-pages.module.css";

type AgencyDraft = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
};

const emptyDraft: AgencyDraft = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  website: "",
};

const fromAgency = (agency: Agency): AgencyDraft => ({
  name: agency.name,
  description: agency.description,
  phone: agency.phone,
  email: agency.email,
  address: agency.address,
  website: agency.website || "",
});

const Verified = AgencyVerified;

function ErrorNotice({ children }: { children: string }) {
  return children ? (
    <p className={styles.error} role="alert">
      {children}
    </p>
  ) : null;
}

function AgencyForm({
  agency,
  onSaved,
  showHeading = Boolean(agency),
}: {
  agency?: Agency;
  onSaved?: (agency: Agency) => void;
  showHeading?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<AgencyDraft>(
    agency ? fromAgency(agency) : emptyDraft,
  );
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    agency?.image?.url || null,
  );
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const selectLogo = (file?: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError(t("agency.logoValidation"));
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setLogo(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeLogo = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setLogo(null);
    setPreview(null);
  };

  const update = (key: keyof AgencyDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setError("");

    if (
      !draft.name.trim() ||
      !draft.description.trim() ||
      !draft.phone.trim() ||
      !draft.email.trim() ||
      !draft.address.trim()
    ) {
      setError(t("agency.required"));
      return;
    }

    setBusy(true);

    try {
      const data = new FormData();

      Object.entries(draft).forEach(([key, value]) => {
        if (value.trim()) data.append(key, value.trim());
      });

      if (logo) {
        data.append("logo", logo);
      }

      if (agency) {
        await agencyApi.change(data);
        onSaved?.(await agencyApi.mine());
      } else {
        await agencyApi.create(data);
        router.replace("/my-agency?created=1");
      }
    } catch (reason) {
      setError(apiMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const logoAgency = preview
    ? {
        ...(agency || {
          id: 0,
          name: draft.name,
          description: "",
          phone: "",
          email: "",
          address: "",
          verified: false,
        }),
        image: { id: 0, url: preview },
      }
    : undefined;

  return (
    <form className={styles.form} onSubmit={submit}>
      {showHeading && (
        <div className={styles.formTop}>
          <div>
            <span className={styles.formKicker}>
              <Building2 size={14} />
              {t("agency.eyebrow")}
            </span>
            <h2>{t("agency.editTitle")}</h2>
            <p>{t("agency.editCopy")}</p>
          </div>
          <span className={styles.formStep}>02</span>
        </div>
      )}

      <section
        className={`${styles.uploadCard} ${dragging ? styles.uploadCardDragging : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectLogo(event.dataTransfer.files?.[0]);
        }}
      >
        <div className={styles.uploadVisual}>
          <AgencyLogo agency={logoAgency} size="large" />
          <span className={styles.uploadPulse} aria-hidden="true" />
        </div>

        <div className={styles.uploadCopy}>
          <strong>{t("agency.logo")}</strong>
          <p>{t("agency.logoHint")}</p>
          <span>{t("agency.dropLogo")}</span>
        </div>

        <input
          ref={input}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => selectLogo(event.target.files?.[0])}
        />

        <div className={styles.uploadActions}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => input.current?.click()}
          >
            <UploadCloud size={16} />
            {preview ? t("agency.changeLogo") : t("agency.uploadLogo")}
          </button>

          {preview && (
            <button
              type="button"
              className={styles.textButton}
              onClick={removeLogo}
            >
              <Trash2 size={15} />
              {t("agency.removeLogo")}
            </button>
          )}
        </div>

        {dragging && (
          <span className={styles.dropHint}>{t("agency.dropLogo")}</span>
        )}
      </section>

      <div className={styles.formGrid}>
        <label>
          <span>{t("agency.name")}</span>
          <input
            className="field"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </label>

        <label>
          <span>{t("agency.email")}</span>
          <input
            className="field"
            type="email"
            value={draft.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </label>

        <label>
          <span>{t("agency.phone")}</span>
          <input
            className="field"
            value={draft.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
          />
        </label>

        <label>
          <span>{t("agency.website")}</span>
          <input
            className="field"
            type="url"
            value={draft.website}
            onChange={(event) => update("website", event.target.value)}
            placeholder="https://"
          />
        </label>

        <label className={styles.full}>
          <span>{t("agency.address")}</span>
          <input
            className="field"
            value={draft.address}
            onChange={(event) => update("address", event.target.value)}
            required
          />
        </label>

        <label className={styles.full}>
          <span>{t("agency.description")}</span>
          <textarea
            className="field"
            rows={5}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
            required
          />
        </label>
      </div>

      <ErrorNotice>{error}</ErrorNotice>

      <div className={styles.formFooter}>
        <Link
          href={agency ? "/my-agency" : "/profile"}
          className="btn-secondary"
        >
          {t("common.cancel")}
        </Link>
        <button className="btn-primary" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              {agency ? t("agency.saving") : t("agency.creating")}
            </>
          ) : (
            <>
              <ImagePlus size={17} />
              {agency ? t("agency.save") : t("agency.create")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function CreateAgencyPage() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <div className={`shell ${styles.narrow}`}>
        <header className={styles.intro}>
          <p className="eyebrow">{t("agency.eyebrow")}</p>
          <h1>{t("agency.createTitle")}</h1>
          <p>{t("agency.createCopy")}</p>
        </header>
        <AgencyForm showHeading={false} />
      </div>
    </main>
  );
}

export function MyAgencyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([agencyApi.mine(), propertiesApi.mine()])
      .then(([current, mine]) => {
        if (!active) return;
        setAgency(current);
        setProperties(
          mine.filter((property) => property.agency?.id === current.id),
        );
      })
      .catch((reason) => {
        if (!active) return;
        const status = (reason as { response?: { status?: number } }).response
          ?.status;

        if (status === 404) {
          router.replace("/agency/create");
        } else {
          setError(apiMessage(reason));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const deleteAgency = async () => {
    if (!agency || !window.confirm(t("agency.deleteConfirm"))) return;

    setRemoving(true);
    setError("");

    try {
      await agencyApi.delete(agency.id);
      router.replace("/profile?agencyDeleted=1");
    } catch (reason) {
      setError(apiMessage(reason));
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={`shell ${styles.narrow}`}>
          <div className={styles.loadingShell}>
            <div className={styles.loadingHero} />
            <div className={styles.loadingStats}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.loadingContent} />
          </div>
        </div>
      </main>
    );
  }

  if (!agency) return null;

  return (
    <main className={styles.page}>
      <div className="shell">
        <header className={styles.intro}>
          <p className="eyebrow">{t("agency.eyebrow")}</p>
          <h1>{editing ? t("agency.editTitle") : t("agency.myAgency")}</h1>
          <p>
            {editing ? t("agency.editCopy") : t("agency.dashboardCopy")}
          </p>
        </header>

        {editing ? (
          <AgencyForm
            agency={agency}
            onSaved={(updated) => {
              setAgency(updated);
              setEditing(false);
              setSuccess(t("agency.saved"));
            }}
          />
        ) : (
          <>
            <section className={styles.dashboard}>
              <div className={styles.dashboardGlow} aria-hidden="true" />

              <div className={styles.dashboardIdentity}>
                <AgencyLogo agency={agency} size="large" />
                <div className={styles.dashboardCopy}>
                  <div className={styles.dashboardEyebrow}>
                    <span>{t("agency.eyebrow")}</span>
                    <Verified verified={agency.verified} />
                  </div>
                  <div className={styles.titleRow}>
                    <h2>{agency.name}</h2>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </div>
                  <p>{agency.description}</p>
                </div>
              </div>

              <div className={styles.dashboardActions}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSuccess("");
                    setEditing(true);
                  }}
                >
                  <Pencil size={16} />
                  {t("agency.edit")}
                </button>
                <button
                  className={styles.dangerButton}
                  disabled={removing}
                  onClick={() => void deleteAgency()}
                >
                  <Trash2 size={16} />
                  {removing ? t("agency.deleting") : t("agency.delete")}
                </button>
              </div>
            </section>

            <section className={styles.statGrid} aria-label={t("agency.properties")}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <Building2 size={17} />
                </span>
                <strong>{properties.length}</strong>
                <span className={styles.statLabel}>{t("agency.properties")}</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <Eye size={17} />
                </span>
                <strong>
                  {properties.reduce(
                    (sum, property) => sum + (property.views || 0),
                    0,
                  )}
                </strong>
                <span className={styles.statLabel}>{t("agency.views")}</span>
              </div>


            </section>

            <section className={styles.contactCard}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>
                  <Phone size={16} />
                </span>
                <div>
                  <small>{t("agency.phone")}</small>
                  <span>{agency.phone}</span>
                </div>
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>
                  <Mail size={16} />
                </span>
                <div>
                  <small>{t("agency.email")}</small>
                  <span>{agency.email}</span>
                </div>
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>
                  <MapPin size={16} />
                </span>
                <div>
                  <small>{t("agency.address")}</small>
                  <span>{agency.address}</span>
                </div>
              </div>

              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactItem}
                >
                  <span className={styles.contactIcon}>
                    <Globe2 size={16} />
                  </span>
                  <div>
                    <small>{t("agency.website")}</small>
                    <span>{agency.website}</span>
                  </div>
                </a>
              )}
            </section>

            <ErrorNotice>{error}</ErrorNotice>
            {success && <p className={styles.success}>{success}</p>}

            <section className={styles.propertiesHead}>
              <div>
                <p className="eyebrow">{t("agency.properties")}</p>
                <h2>{t("agency.yourProperties")}</h2>
              </div>

              <Link href="/my-properties" className="btn-secondary">
                {t("agency.manageProperties")}
                <ChevronRight size={16} />
              </Link>
            </section>

            {properties.length ? (
              <div className={styles.propertyGrid}>
                {properties.map((property) => (
                  <PropertyCard property={property} key={property.id} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  <Building2 size={24} />
                </span>
                <div>
                  <h2>{t("agency.noProperties")}</h2>
                  <p>{t("agency.discoverCopy")}</p>
                </div>
                <Link href="/properties/create" className="btn-primary">
                  <Plus size={16} />
                  {t("navigation.addListing")}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export function AgencyPublicPage({ id }: { id: string }) {
  const { t } = useI18n();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([agencyApi.one(id), propertiesApi.all()])
      .then(([current, all]) => {
        if (!active) return;
        setAgency(current);
        setProperties(
          all.filter(
            (property) =>
              property.agency?.id === current.id && isPublicProperty(property),
          ),
        );
      })
      .catch((reason) => {
        if (active) setError(apiMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="shell">
          <div className={styles.loadingShell}>
            <div className={styles.loadingPublicHero} />
            <div className={styles.loadingContent} />
          </div>
        </div>
      </main>
    );
  }

  if (error || !agency) {
    return (
      <main className={styles.page}>
        <div className="shell">
          <ErrorNotice>{error || t("property.notFound")}</ErrorNotice>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="shell">
        <section className={styles.publicHero}>
          <div className={styles.publicHeroGlow} aria-hidden="true" />
          <AgencyLogo agency={agency} size="large" />

          <div className={styles.publicHeroCopy}>
            <div className={styles.dashboardEyebrow}>
              <span>{t("agency.eyebrow")}</span>
              <Verified verified={agency.verified} />
            </div>
            <h1>{agency.name}</h1>
            <p>{agency.description}</p>

            <div className={styles.publicMeta}>
              <span>
                <MapPin size={15} />
                {agency.address}
              </span>
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 size={15} />
                  {t("agency.website")}
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>

          <div className={styles.publicStats}>
            <strong>{properties.length}</strong>
            <span>{t("agency.properties")}</span>
          </div>
        </section>

        <section className={styles.propertiesHead}>
          <div>
            <p className="eyebrow">{t("agency.eyebrow")}</p>
            <h2>{t("agency.properties")}</h2>
          </div>

          <a className="btn-secondary" href={`tel:${agency.phone}`}>
            <Phone size={16} />
            {t("agency.call")}
          </a>
        </section>

        {properties.length ? (
          <div className={styles.propertyGrid}>
            {properties.map((property) => (
              <PropertyCard property={property} key={property.id} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Building2 size={24} />
            </span>
            <div>
              <h2>{t("agency.noPublicProperties")}</h2>
              <p>{t("agency.discoverCopy")}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function AgenciesPage() {
  const { t } = useI18n();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    agencyApi
      .all()
      .then((items) => {
        if (active) setAgencies(items);
      })
      .catch((reason) => {
        if (active) setError(apiMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className="shell">
        <header className={styles.intro}>
          <p className="eyebrow">{t("agency.eyebrow")}</p>
          <h1>{t("agency.discoverTitle")}</h1>
          <p>{t("agency.discoverCopy")}</p>
        </header>

        {loading ? (
          <div className={styles.agencyGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className={styles.agencySkeleton} />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice>{error}</ErrorNotice>
        ) : agencies.length ? (
          <div className={styles.agencyGrid}>
            {agencies.map((agency) => (
              <Link
                className={styles.agencyCard}
                href={`/agency/${agency.id}`}
                key={agency.id}
              >
                <div className={styles.agencyCardTop}>
                  <AgencyLogo agency={agency} />
                  <ArrowUpRight size={17} aria-hidden="true" />
                </div>

                <div className={styles.agencyCardBody}>
                  <div className={styles.titleRow}>
                    <h2>{agency.name}</h2>
                    <Verified verified={agency.verified} />
                  </div>
                  <p>{agency.description}</p>
                  <span className={styles.agencyAddress}>
                    <MapPin size={14} />
                    {agency.address}
                  </span>
                </div>

                <span className={styles.agencyCardFooter}>
                  <span>{t("agency.view")}</span>
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Building2 size={24} />
            </span>
            <div>
              <h2>{t("agency.noAgencies")}</h2>
              <p>{t("agency.discoverCopy")}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
