"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  ArchiveRestore,
  BarChart3,
  BedDouble,
  CheckCircle2,
  Clock3,
  Eye,
  ExternalLink,
  LayoutGrid,
  Map,
  MapPin,
  Maximize2,
  Pencil,
  Plus,
  XCircle,
} from "lucide-react";

import {
  apiMessage,
  propertiesApi,
} from "@/lib/api";

import type {
  Property,
} from "@/types/models";

import {
  categoryLabels,
  cityOf,
  formatMoney,
  getListingLabel,
  priceOf,
} from "./property-presentation";

import {
  useI18n,
} from "@/context/i18n-context";

type OwnerFilter =
  | "all"
  | "published"
  | "pending"
  | "rejected"
  | "archived";

type OwnerSort =
  | "newest"
  | "oldest"
  | "price-desc"
  | "price-asc";

function listingState(
  property: Property,
  t: (key: string) => string,
) {
  if (
    property.status ===
    "archived"
  ) {
    return {
      key: "archived",
      label: t(
        "myListings.archived",
      ),
      icon: Archive,
    };
  }

  if (
    property.publishing ===
    "PENDING"
  ) {
    return {
      key: "pending",
      label: t(
        "myListings.pending",
      ),
      icon: Clock3,
    };
  }

  if (
    property.publishing ===
    "REJECTED"
  ) {
    return {
      key: "rejected",
      label: t(
        "myListings.rejected",
      ),
      icon: XCircle,
    };
  }

  if (
    property.status === "sold"
  ) {
    return {
      key: "published",
      label: t(
        "status.SOLD",
      ),
      icon: CheckCircle2,
    };
  }

  if (
    property.status ===
    "rented"
  ) {
    return {
      key: "published",
      label: t(
        "status.RENTED",
      ),
      icon: CheckCircle2,
    };
  }

  return {
    key: "published",
    label: t(
      "myListings.published",
    ),
    icon: CheckCircle2,
  };
}

function matchesFilter(
  property: Property,
  filter: OwnerFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (
    filter === "archived"
  ) {
    return (
      property.status ===
      "archived"
    );
  }

  if (
    filter === "pending"
  ) {
    return (
      property.publishing ===
      "PENDING"
    );
  }

  if (
    filter === "rejected"
  ) {
    return (
      property.publishing ===
      "REJECTED"
    );
  }

  return (
    property.status !==
      "archived" &&
    property.publishing !==
      "PENDING" &&
    property.publishing !==
      "REJECTED"
  );
}

function sortListings(
  items: Property[],
  sort: OwnerSort,
) {
  return [...items].sort(
    (first, second) => {
      if (
        sort === "price-asc"
      ) {
        return (
          Number(
            first.price,
          ) -
          Number(
            second.price,
          )
        );
      }

      if (
        sort === "price-desc"
      ) {
        return (
          Number(
            second.price,
          ) -
          Number(
            first.price,
          )
        );
      }

      const firstTime =
        first.createdAt
          ? new Date(
              first.createdAt,
            ).getTime()
          : 0;

      const secondTime =
        second.createdAt
          ? new Date(
              second.createdAt,
            ).getTime()
          : 0;

      return sort ===
        "oldest"
        ? firstTime -
            secondTime
        : secondTime -
            firstTime;
    },
  );
}

function OwnerPropertyCard({
  property,
  onArchive,
  onRestore,
  actionBusy,
}: {
  property: Property;
  onArchive: (
    property: Property,
  ) => void;
  onRestore: (
    property: Property,
  ) => void;
  actionBusy: boolean;
}) {
  const { t } = useI18n();

  const image =
    property.images?.[0]?.url;

  const state =
    listingState(
      property,
      t,
    );

  const StatusIcon =
    state.icon;

  const pricePerSquareMeter =
    property.area > 0
      ? Math.round(
          Number(
            property.price,
          ) / property.area,
        )
      : undefined;

  return (
    <article
      className={`owner-property-card ${
        state.key ===
        "archived"
          ? "is-archived"
          : ""
      }`}
    >
      <Link
        href={`/properties/${property.id}`}
        className="owner-property-image"
        aria-label={`${t(
          "common.viewProperty",
        )}: ${property.title}`}
      >
        {image ? (
          <img
            src={image}
            alt={property.title}
          />
        ) : (
          <div className="owner-property-placeholder" />
        )}

        <div className="owner-property-image-top">
          <span>
            {categoryLabels[
              property.category
            ] ||
              property.category}
          </span>

          {property.listing && (
            <span>
              {getListingLabel(
                property.listing,
              )}
            </span>
          )}
        </div>

        <span
          className={`owner-status-badge is-${state.key}`}
        >
          <StatusIcon
            size={13}
          />

          {state.label}
        </span>

        <div className="owner-property-price">
          <small>
            {t(
              "common.price",
            )}
          </small>

          <strong>
            {priceOf(
              property,
            )}
          </strong>

          {pricePerSquareMeter && (
            <span>
              {t(
                "property.pricePerSquareMeter",
                {
                  price:
                    formatMoney(
                      pricePerSquareMeter,
                      property.currency,
                    ),
                },
              )}
            </span>
          )}
        </div>
      </Link>

      <div className="owner-property-content">
        <Link
          href={`/properties/${property.id}`}
          className="owner-property-title"
        >
          <h2>
            {property.title}
          </h2>

          <p>
            <MapPin size={14} />
            {cityOf(
              property.city,
            )}
          </p>
        </Link>

        <div className="owner-property-facts">
          <span>
            <BedDouble
              size={15}
            />

            {property.rooms}{" "}
            {t(
              "common.rooms",
            )}
          </span>

          <span>
            <Maximize2
              size={15}
            />

            {property.area} m²
          </span>

          <span>
            <Eye size={15} />

            {property.views}{" "}
            {t(
              "common.views",
            )}
          </span>
        </div>
      </div>

      <footer className="owner-property-actions">
        <Link
          href={`/properties/${property.id}`}
          className="btn-primary"
        >
          <ExternalLink
            size={15}
          />

          {t(
            "myListings.view",
          )}
        </Link>

        <Link
          href={`/my-properties/${property.id}/analytics`}
          className="btn-secondary"
          aria-label={`Analytics: ${property.title}`}
        >
          <BarChart3
            size={15}
          />

          Analytics
        </Link>

        <Link
          href={`/properties/${property.id}/edit`}
          className="btn-secondary"
        >
          <Pencil size={15} />

          {t(
            "myListings.edit",
          )}
        </Link>

        {property.status ===
        "archived" ? (
          <button
            type="button"
            onClick={() =>
              onRestore(
                property,
              )
            }
            disabled={
              actionBusy
            }
            className="owner-restore-action"
          >
            <ArchiveRestore
              size={15}
            />

            {actionBusy
              ? t(
                  "common.loading",
                )
              : t(
                  "myListings.restore",
                )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              onArchive(
                property,
              )
            }
            disabled={
              actionBusy
            }
            className="owner-archive-action"
          >
            <Archive
              size={15}
            />

            {actionBusy
              ? t(
                  "common.loading",
                )
              : t(
                  "myListings.archive",
                )}
          </button>
        )}
      </footer>
    </article>
  );
}

export function OwnerListingsPage() {
  const { t } = useI18n();

  const [
    items,
    setItems,
  ] = useState<Property[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<OwnerFilter>(
      "all",
    );

  const [
    sort,
    setSort,
  ] =
    useState<OwnerSort>(
      "newest",
    );

  const [
    archiveTarget,
    setArchiveTarget,
  ] =
    useState<Property | null>(
      null,
    );

  const [
    actionId,
    setActionId,
  ] =
    useState<number | null>(
      null,
    );

  const load = () => {
    setLoading(true);
    setError("");

    propertiesApi
      .mine()
      .then(setItems)
      .catch((reason) =>
        setError(
          apiMessage(reason),
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  };

  useEffect(() => {
    const timer =
      window.setTimeout(
        load,
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,

      published:
        items.filter(
          (item) =>
            matchesFilter(
              item,
              "published",
            ),
        ).length,

      pending:
        items.filter(
          (item) =>
            matchesFilter(
              item,
              "pending",
            ),
        ).length,

      rejected:
        items.filter(
          (item) =>
            matchesFilter(
              item,
              "rejected",
            ),
        ).length,

      archived:
        items.filter(
          (item) =>
            matchesFilter(
              item,
              "archived",
            ),
        ).length,
    }),
    [items],
  );

  const visibleItems =
    useMemo(
      () =>
        sortListings(
          items.filter(
            (item) =>
              matchesFilter(
                item,
                filter,
              ),
          ),
          sort,
        ),
      [
        filter,
        items,
        sort,
      ],
    );

  const filters: Array<{
    key: OwnerFilter;
    label: string;
  }> = [
    {
      key: "all",
      label: t(
        "myListings.all",
      ),
    },
    {
      key: "published",
      label: t(
        "myListings.published",
      ),
    },
    {
      key: "pending",
      label: t(
        "myListings.pending",
      ),
    },
    {
      key: "rejected",
      label: t(
        "myListings.rejected",
      ),
    },
    {
      key: "archived",
      label: t(
        "myListings.archived",
      ),
    },
  ];

  const archive =
    async () => {
      if (
        !archiveTarget
      ) {
        return;
      }

      setActionId(
        archiveTarget.id,
      );

      setNotice("");

      try {
        await propertiesApi.archive(
          archiveTarget.id,
        );

        setNotice(
          t(
            "myListings.archived",
          ),
        );

        setArchiveTarget(
          null,
        );

        load();
      } catch (reason) {
        setError(
          apiMessage(reason),
        );

        setArchiveTarget(
          null,
        );
      } finally {
        setActionId(null);
      }
    };

  const restore =
    async (
      property: Property,
    ) => {
      setActionId(
        property.id,
      );

      setNotice("");
      setError("");

      try {
        await propertiesApi.restore(
          property.id,
        );

        setNotice(
          t(
            "myListings.restore",
          ),
        );

        load();
      } catch (reason) {
        setError(
          apiMessage(reason),
        );
      } finally {
        setActionId(null);
      }
    };

  const emptyCopy: Record<
    Exclude<
      OwnerFilter,
      "all"
    >,
    [string, string]
  > = {
    published: [
      t(
        "myListings.noListings",
      ),
      t(
        "myListings.copy",
      ),
    ],

    pending: [
      t(
        "myListings.noListings",
      ),
      t(
        "myListings.copy",
      ),
    ],

    rejected: [
      t(
        "myListings.noListings",
      ),
      t(
        "myListings.copy",
      ),
    ],

    archived: [
      t(
        "myListings.noListings",
      ),
      t(
        "myListings.copy",
      ),
    ],
  };

  return (
    <main className="owner-listings-page">
      <div className="shell owner-listings-shell">
        <section className="owner-workspace-hero">
          <header className="owner-listings-intro">
            <div>
              <p className="eyebrow">
                {t(
                  "myListings.eyebrow",
                )}
              </p>

              <h1>
                {t(
                  "myListings.title",
                )}
              </h1>

              <p>
                {t(
                  "myListings.copy",
                )}
              </p>
            </div>

            <div className="owner-intro-actions">
              <Link
                href="/my-properties/map"
                className="btn-secondary"
              >
                <Map
                  size={16}
                />

                {t(
                  "myListings.mapView",
                )}
              </Link>

              <Link
                href="/properties/create"
                className="btn-primary"
              >
                <Plus
                  size={16}
                />

                {t(
                  "myListings.createListing",
                )}
              </Link>
            </div>
          </header>

          <div className="owner-summary-row">
            <span>
              <b>
                {t(
                  "myListings.all",
                )}
              </b>

              <strong>
                {loading
                  ? "—"
                  : counts.all}
              </strong>
            </span>

            <span>
              <b>
                {t(
                  "myListings.published",
                )}
              </b>

              <strong>
                {loading
                  ? "—"
                  : counts.published}
              </strong>
            </span>

            <span>
              <b>
                {t(
                  "myListings.pending",
                )}
              </b>

              <strong>
                {loading
                  ? "—"
                  : counts.pending}
              </strong>
            </span>

            <span>
              <b>
                {t(
                  "myListings.rejected",
                )}
              </b>

              <strong>
                {loading
                  ? "—"
                  : counts.rejected}
              </strong>
            </span>

            <span>
              <b>
                {t(
                  "myListings.archived",
                )}
              </b>

              <strong>
                {loading
                  ? "—"
                  : counts.archived}
              </strong>
            </span>
          </div>
        </section>

        <section className="owner-listings-section">
          <div className="owner-listings-section-head">
            <div>
              <h2>
                {t(
                  "myListings.title",
                )}
              </h2>

              <p>
                {loading
                  ? t(
                      "common.loading",
                    )
                  : t(
                      "search.listingsFound",
                      {
                        count:
                          visibleItems.length,
                      },
                    )}
              </p>
            </div>

            <p>
              {t(
                "myListings.copy",
              )}
            </p>
          </div>

          <div className="owner-listing-toolbar">
            <div
              className="owner-filter-tabs"
              role="tablist"
              aria-label={t(
                "property.status",
              )}
            >
              {filters.map(
                (item) => (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    role="tab"
                    aria-selected={
                      filter ===
                      item.key
                    }
                    className={
                      filter ===
                      item.key
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        item.key,
                      )
                    }
                  >
                    {
                      item.label
                    }

                    <span>
                      {
                        counts[
                          item
                            .key
                        ]
                      }
                    </span>
                  </button>
                ),
              )}
            </div>

            <label className="owner-sort">
              <span>
                {t(
                  "search.sortListings",
                )}
              </span>

              <select
                value={sort}
                onChange={(
                  event,
                ) =>
                  setSort(
                    event
                      .target
                      .value as OwnerSort,
                  )
                }
              >
                <option value="newest">
                  {t(
                    "search.newest",
                  )}
                </option>

                <option value="oldest">
                  {t(
                    "search.oldest",
                  )}
                </option>

                <option value="price-desc">
                  {t(
                    "search.highToLow",
                  )}
                </option>

                <option value="price-asc">
                  {t(
                    "search.lowToHigh",
                  )}
                </option>
              </select>
            </label>
          </div>

          {notice && (
            <p
              className="owner-listings-notice"
              role="status"
            >
              {notice}
            </p>
          )}

          {error && (
            <div
              className="owner-listings-error"
              role="alert"
            >
              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={load}
              >
                Try again
              </button>
            </div>
          )}

          {!error && (
            <div className="owner-property-grid">
              {loading
                ? [
                    1,
                    2,
                    3,
                  ].map(
                    (item) => (
                      <div
                        className="owner-property-skeleton"
                        key={
                          item
                        }
                      />
                    ),
                  )
                : visibleItems.map(
                    (
                      property,
                    ) => (
                      <OwnerPropertyCard
                        key={
                          property.id
                        }
                        property={
                          property
                        }
                        onArchive={
                          setArchiveTarget
                        }
                        onRestore={
                          restore
                        }
                        actionBusy={
                          actionId ===
                          property.id
                        }
                      />
                    ),
                  )}
            </div>
          )}

          {!loading &&
            !error &&
            !items.length && (
              <div className="owner-listings-empty">
                <LayoutGrid
                  size={28}
                />

                <h2>
                  {t(
                    "myListings.noListings",
                  )}
                </h2>

                <p>
                  {t(
                    "myListings.copy",
                  )}
                </p>

                <Link
                  href="/properties/create"
                  className="btn-primary"
                >
                  <Plus
                    size={16}
                  />

                  {t(
                    "myListings.createListing",
                  )}
                </Link>
              </div>
            )}

          {!loading &&
            !error &&
            items.length > 0 &&
            !visibleItems.length && (
              <div className="owner-listings-empty compact">
                <h2>
                  {filter ===
                  "all"
                    ? t(
                        "myListings.noListings",
                      )
                    : emptyCopy[
                        filter
                      ][0]}
                </h2>

                <p>
                  {filter ===
                  "all"
                    ? t(
                        "myListings.copy",
                      )
                    : emptyCopy[
                        filter
                      ][1]}
                </p>
              </div>
            )}
        </section>

        {archiveTarget && (
          <div
            className="owner-confirm-backdrop"
            role="presentation"
          >
            <section
              className="owner-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="archive-title"
            >
              <p className="eyebrow">
                {t(
                  "myListings.archive",
                )}
              </p>

              <h2 id="archive-title">
                {t(
                  "myListings.archive",
                )}
              </h2>

              <p>
                {t(
                  "myListings.copy",
                )}
              </p>

              <div>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    actionId !==
                    null
                  }
                  onClick={() =>
                    setArchiveTarget(
                      null,
                    )
                  }
                >
                  {t(
                    "common.cancel",
                  )}
                </button>

                <button
                  type="button"
                  className="owner-archive-action"
                  disabled={
                    actionId !==
                    null
                  }
                  onClick={
                    archive
                  }
                >
                  {actionId
                    ? t(
                        "common.loading",
                      )
                    : t(
                        "myListings.archive",
                      )}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}