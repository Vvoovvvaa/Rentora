"use client";

import Link from "next/link";

import {
  ArrowRight,
  Map,
  MessageSquareMore,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiMessage,
  propertiesApi,
  userApi,
} from "@/lib/api";

import type {
  Property,
  SearchParams,
} from "@/types/models";

import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";

import {
  categoryLabels,
  cityOf,
  getListingLabel,
  isPublicProperty,
} from "./property-presentation";

import {
  PropertyCard,
  PropertySkeleton,
} from "./property-card";

import { SearchForm } from "./search-form";

import { OwnerListingsPage } from "./owner-listings-page";

import styles from "./properties-catalog.module.css";

type ListingsViewProps = {
  kind: string;
};

export function ListingsView({
  kind,
}: ListingsViewProps) {
  if (
    kind ===
    "my-properties"
  ) {
    return (
      <RequireLogin>
        <OwnerListingsPage />
      </RequireLogin>
    );
  }

  if (
    kind ===
    "favorites"
  ) {
    return (
      <RequireLogin>
        <PropertiesCatalog
          kind="favorites"
        />
      </RequireLogin>
    );
  }

  return (
    <PropertiesCatalog
      kind="properties"
    />
  );
}

function RequireLogin({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const {
    user,
    loading,
  } = useAuth();

  const { t } =
    useI18n();

  if (loading) {
    return (
      <main
        className={
          styles.catalogPage
        }
      >
        <div className="shell">
          <div
            className={`${styles.skeletonPulse} ${styles.loginSkeleton}`}
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className={
          styles.catalogPage
        }
      >
        <div
          className={`shell ${styles.loginRequired}`}
        >
          <UserRound
            size={34}
          />

          <h1>
            {t(
              "auth.welcomeBack",
            )}
          </h1>

          <p>
            {t(
              "auth.signInCopy",
            )}
          </p>

          <Link
            href="/login"
            className={
              styles.loginButton
            }
          >
            {t(
              "navigation.logIn",
            )}

            <ArrowRight
              size={16}
            />
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

function PropertiesCatalog({
  kind,
}: {
  kind:
    | "properties"
    | "favorites";
}) {
  const params =
    useSearchParams();

  const router =
    useRouter();

  const { t } =
    useI18n();

  const query =
    params.toString();

  const [
    items,
    setItems,
  ] =
    useState<
      Property[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const title =
    kind ===
    "favorites"
      ? "Saved homes"
      : "Explore homes";

  const subtitle =
    kind ===
    "favorites"
      ? "Keep the homes you liked close at hand and come back when you're ready."
      : "Search faster, compare smarter, and discover homes across Armenia with a cleaner catalogue experience.";

  const eyebrow =
    kind ===
    "favorites"
      ? "Favorites"
      : "Properties";

  const load =
    useCallback(() => {
      setLoading(true);
      setError("");

      let request:
        Promise<
          Property[]
        >;

      if (
        kind ===
        "favorites"
      ) {
        request =
          userApi
            .favorites()
            .then(
              (result) =>
                result.map(
                  (
                    favorite,
                  ) =>
                    favorite.property,
                ),
            );
      } else if (
        query
      ) {
        const data:
          SearchParams =
          {};

        const parsed =
          new URLSearchParams(
            query,
          );

        parsed.forEach(
          (
            value,
            key,
          ) => {
            if (
              key ===
                "minPrice" ||
              key ===
                "maxPrice" ||
              key ===
                "rooms" ||
              key ===
                "area" ||
              key ===
                "bedrooms" ||
              key ===
                "floor" ||
              key ===
                "constructionYear"
            ) {
              (
                data as Record<
                  string,
                  number
                >
              )[key] =
                Number(
                  value,
                );

              return;
            }

            (
              data as Record<
                string,
                string
              >
            )[key] =
              value;
          },
        );

        request =
          propertiesApi.search(
            data,
          );
      } else {
        request =
          propertiesApi.all();
      }

      request
        .then(
          (result) =>
            setItems(
              result.filter(
                isPublicProperty,
              ),
            ),
        )
        .catch(
          (reason) =>
            setError(
              apiMessage(
                reason,
              ),
            ),
        )
        .finally(
          () =>
            setLoading(
              false,
            ),
        );
    }, [
      kind,
      query,
    ]);

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
  }, [load]);

  const chips =
    useMemo(() => {
      if (
        kind !==
        "properties"
      ) {
        return [];
      }

      const current =
        new URLSearchParams(
          query,
        );

      return Array.from(
        current.entries(),
      )
        .filter(
          ([
            key,
            value,
          ]) =>
            Boolean(
              value,
            ) &&
            [
              "city",
              "category",
              "listing",
              "rooms",
              "minPrice",
              "maxPrice",
              "currency",
              "bedrooms",
              "floor",
              "constructionYear",
              "area",
              "features",
            ].includes(
              key,
            ),
        )
        .map(
          ([
            key,
            value,
          ]) => ({
            key,
            value,
            label:
              getFilterLabel(
                key,
                value,
              ),
          }),
        );
    }, [
      kind,
      query,
    ]);

  const removeFilter = (
    key: string,
  ) => {
    const next =
      new URLSearchParams(
        query,
      );

    next.delete(key);

    router.replace(
      `/properties${
        next.size
          ? `?${next.toString()}`
          : ""
      }`,
    );
  };

  const clearFilters =
    () => {
      router.replace(
        "/properties",
      );
    };

  return (
    <main
      className={
        styles.catalogPage
      }
    >
      <div className="shell">
        <section
          className={
            styles.catalogHero
          }
        >
          <div
            className={
              styles.catalogHeroGlow
            }
            aria-hidden="true"
          />

          <div
            className={
              styles.catalogHeroCopy
            }
          >
            <p
              className={
                styles.catalogEyebrow
              }
            >
              {eyebrow}
            </p>

            <h1>
              {title}
            </h1>

            <p
              className={
                styles.catalogHeroSubtitle
              }
            >
              {subtitle}
            </p>

            {kind ===
              "properties" && (
              <div
                className={
                  styles.catalogHeroPills
                }
              >
                <span>
                  <Sparkles
                    size={14}
                  />
                  AI-guided search
                </span>

                <span>
                  <Map
                    size={14}
                  />
                  Map-first discovery
                </span>

                <span>
                  <MessageSquareMore
                    size={14}
                  />
                  Direct owner contact
                </span>

                <span>
                  <ShieldCheck
                    size={14}
                  />
                  Cleaner browsing
                </span>
              </div>
            )}
          </div>

          <div
            className={
              styles.catalogHeroMark
            }
            aria-hidden="true"
          >
            <span>
              AM
            </span>

            <div>
              <strong>
                Armenia
              </strong>

              <small>
                Rentora
              </small>
            </div>
          </div>
        </section>

        {kind ===
          "properties" && (
          <section
            className={
              styles.catalogSearchWrapper
            }
          >
            <div
              className={
                styles.catalogSearchIntro
              }
            >
              <div>
                <p>
                  Refine your
                  search
                </p>

                <h3>
                  Start broad,
                  then narrow by
                  city, budget,
                  and home type.
                </h3>
              </div>

              <Link
                href="/map"
                className={
                  styles.catalogInlineMapLink
                }
              >
                <Map
                  size={16}
                />
                Browse on map
              </Link>
            </div>

            <SearchForm
              compact
              submitPath="/properties"
            />

            <div
              className={
                styles.catalogQuickLinks
              }
            >
              <span>
                Popular:
              </span>

              <Link href="/properties?city=YEREVAN">
                {cityOf(
                  "YEREVAN",
                )}
              </Link>

              <Link href="/properties?city=GYUMRI">
                {cityOf(
                  "GYUMRI",
                )}
              </Link>

              <Link href="/properties?city=DILIJAN">
                {cityOf(
                  "DILIJAN",
                )}
              </Link>

              <Link href="/properties?city=SEVAN">
                {cityOf(
                  "SEVAN",
                )}
              </Link>
            </div>
          </section>
        )}

        <section
          className={
            styles.resultsSection
          }
        >
          <header
            className={
              styles.resultsHeader
            }
          >
            <div>
              <p
                className={
                  styles.resultsEyebrow
                }
              >
                {kind ===
                "favorites"
                  ? "Favorites"
                  : "Properties"}
              </p>

              <div
                className={
                  styles.resultsTitleRow
                }
              >
                <h2>
                  {kind ===
                  "favorites"
                    ? "Saved homes"
                    : "Available homes"}
                </h2>

                {!loading && (
                  <span
                    className={
                      styles.resultsCount
                    }
                  >
                    {
                      items.length
                    }
                  </span>
                )}
              </div>

              <p
                className={
                  styles.resultsHelper
                }
              >
                {kind ===
                "favorites"
                  ? "Your saved homes stay here so you can return to them quickly."
                  : "Clean cards, quicker scanning, and direct access to the full listing."}
              </p>
            </div>

            <div
              className={
                styles.resultsActions
              }
            >
              {kind ===
                "properties" &&
                query && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className={
                      styles.resetButton
                    }
                  >
                    <RotateCcw
                      size={15}
                    />
                    Reset filters
                  </button>
                )}

              <Link
                href="/map"
                className={
                  styles.mapButton
                }
              >
                <Map
                  size={16}
                />
                Search on the map
              </Link>
            </div>
          </header>

          {chips.length >
            0 && (
            <div
              className={
                styles.activeFilters
              }
            >
              {chips.map(
                (chip) => (
                  <button
                    type="button"
                    key={`${chip.key}-${chip.value}`}
                    onClick={() =>
                      removeFilter(
                        chip.key,
                      )
                    }
                  >
                    <span>
                      {
                        chip.label
                      }
                    </span>

                    <X
                      size={13}
                    />
                  </button>
                ),
              )}
            </div>
          )}

          {error && (
            <div
              className={
                styles.catalogError
              }
            >
              <Search
                size={22}
              />

              <div>
                <strong>
                  {error}
                </strong>

                <button
                  type="button"
                  onClick={
                    load
                  }
                >
                  {t(
                    "common.tryAgain",
                  )}
                </button>
              </div>
            </div>
          )}

          {!error && (
            <div
              className={
                styles.propertyGrid
              }
            >
              {loading
                ? [
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                  ].map(
                    (
                      item,
                    ) => (
                      <PropertySkeleton
                        key={
                          item
                        }
                      />
                    ),
                  )
                : items.map(
                    (
                      property,
                    ) => (
                      <PropertyCard
                        key={
                          property.id
                        }
                        property={
                          property
                        }
                        onFavorite={
                          kind ===
                          "favorites"
                            ? load
                            : undefined
                        }
                      />
                    ),
                  )}
            </div>
          )}

          {!loading &&
            !error &&
            items.length ===
              0 && (
              <div
                className={
                  styles.catalogEmpty
                }
              >
                <span>
                  <Search
                    size={24}
                  />
                </span>

                <h3>
                  {kind ===
                  "favorites"
                    ? "No saved homes yet"
                    : "No homes matched your filters"}
                </h3>

                <p>
                  Try fewer
                  filters, a
                  different city,
                  or reset the
                  search to see
                  everything.
                </p>

                {kind ===
                  "properties" &&
                  query && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                    >
                      Reset
                      filters

                      <ArrowRight
                        size={15}
                      />
                    </button>
                  )}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

function getFilterLabel(
  key: string,
  value: string,
) {
  switch (key) {
    case "city":
      return cityOf(
        value,
      );

    case "category":
      return (
        categoryLabels[
          value as keyof typeof categoryLabels
        ] ||
        value
      );

    case "listing":
      return getListingLabel(
        value as never,
      );

    case "rooms":
      return `${value} rooms`;

    case "bedrooms":
      return `${value} bedrooms`;

    case "minPrice":
      return `From ${value}`;

    case "maxPrice":
      return `To ${value}`;

    case "area":
      return `${value} m²`;

    case "floor":
      return `Floor ${value}`;

    case "constructionYear":
      return value;

    case "currency":
      return value.toUpperCase();

    default:
      return value;
  }
}