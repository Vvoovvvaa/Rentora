"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  Map,
  RotateCcw,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

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

type CatalogKind = "properties" | "favorites";

export function ListingsView({ kind }: ListingsViewProps) {
  if (kind === "my-properties") {
    return (
      <RequireLogin>
        <OwnerListingsPage />
      </RequireLogin>
    );
  }

  if (kind === "favorites") {
    return (
      <RequireLogin>
        <PropertiesCatalog kind="favorites" />
      </RequireLogin>
    );
  }

  return <PropertiesCatalog kind="properties" />;
}

function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <main className={styles.catalogPage}>
        <div className={`shell ${styles.catalogShell}`}>
          <div
            className={`${styles.skeletonPulse} ${styles.loginSkeleton}`}
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.catalogPage}>
        <div className={`shell ${styles.loginRequired}`}>
          <span className={styles.loginIcon}>
            <UserRound size={28} />
          </span>

          <h1>{t("auth.welcomeBack")}</h1>
          <p>{t("auth.signInCopy")}</p>

          <Link href="/login" className={styles.loginButton}>
            {t("navigation.logIn")}
            <ArrowRight size={16} />
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
  kind: CatalogKind;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const query = params.toString();

  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFavorites = kind === "favorites";

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    let request: Promise<Property[]>;

    if (isFavorites) {
      request = userApi.favorites().then((result) =>
        result.map((favorite) => favorite.property),
      );
    } else if (query) {
      const data: SearchParams = {};
      const parsed = new URLSearchParams(query);

      const numericKeys = new Set([
        "minPrice",
        "maxPrice",
        "rooms",
        "area",
        "minArea",
        "maxArea",
        "bedrooms",
        "bathrooms",
        "floor",
        "minFloor",
        "maxFloor",
        "constructionYear",
        "minConstructionYear",
        "maxConstructionYear",
      ]);

      parsed.forEach((value, key) => {
        if (numericKeys.has(key)) {
          (data as Record<string, number>)[key] = Number(value);
        } else {
          (data as Record<string, string>)[key] = value;
        }
      });

      request = propertiesApi.search(data);
    } else {
      request = propertiesApi.all();
    }

    request
      .then((result) => {
        setItems(result.filter(isPublicProperty));
      })
      .catch((reason) => {
        setError(apiMessage(reason));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isFavorites, query]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const sortedItems = useMemo(() => {
    if (isFavorites) {
      return items;
    }

    return items
      .map((property, index) => ({
        property,
        index,
      }))
      .sort((first, second) => {
        const boostDifference =
          Number(Boolean(second.property.boops)) -
          Number(Boolean(first.property.boops));

        return boostDifference || first.index - second.index;
      })
      .map(({ property }) => property);
  }, [items, isFavorites]);

  const canShowFeatured =
    !isFavorites && query.length === 0;

  const allBoostedItems = useMemo(
    () =>
      sortedItems.filter((property) =>
        Boolean(property.boops),
      ),
    [sortedItems],
  );

  const featuredItems = useMemo(
    () =>
      canShowFeatured
        ? allBoostedItems.slice(0, 3)
        : [],
    [allBoostedItems, canShowFeatured],
  );

  const showFeatured =
    !loading &&
    !error &&
    featuredItems.length > 0;

  const featuredIds = useMemo(
    () =>
      new Set(
        featuredItems.map((property) => property.id),
      ),
    [featuredItems],
  );

  const catalogItems = useMemo(() => {
    if (canShowFeatured) {
      return sortedItems.filter(
        (property) => !featuredIds.has(property.id),
      );
    }

    return sortedItems;
  }, [canShowFeatured, featuredIds, sortedItems]);

  const chips = useMemo(() => {
    if (isFavorites) {
      return [];
    }

    const visibleFilterKeys = [
      "city",
      "category",
      "listing",
      "rooms",
      "minPrice",
      "maxPrice",
      "currency",
      "bedrooms",
      "bathrooms",
      "floor",
      "minFloor",
      "maxFloor",
      "constructionYear",
      "minConstructionYear",
      "maxConstructionYear",
      "area",
      "minArea",
      "maxArea",
      "features",
    ];

    return Array.from(
      new URLSearchParams(query).entries(),
    )
      .filter(
        ([key, value]) =>
          Boolean(value) &&
          visibleFilterKeys.includes(key),
      )
      .map(([key, value]) => ({
        key,
        value,
        label: getFilterLabel(key, value),
      }));
  }, [isFavorites, query]);

  const removeFilter = (key: string) => {
    const next = new URLSearchParams(query);
    next.delete(key);

    router.replace(
      `/properties${next.size ? `?${next.toString()}` : ""}`,
    );
  };

  const clearFilters = () => {
    router.replace("/properties");
  };

  const displayedCount = showFeatured
    ? catalogItems.length
    : items.length;

  return (
    <main className={styles.catalogPage}>
      <div className={`shell ${styles.catalogShell}`}>
        <section className={styles.catalogHero}>
          <div
            className={styles.catalogHeroGlow}
            aria-hidden="true"
          />

          <div className={styles.catalogHeroCopy}>
            <p className={styles.catalogEyebrow}>
              {isFavorites ? "Favorites" : "Rentora"}
            </p>

            <h1>
              {isFavorites ? "Saved homes" : "Explore homes"}
            </h1>

            <p className={styles.catalogHeroSubtitle}>
              {isFavorites
                ? "Your saved properties."
                : "Find your next home in Armenia."}
            </p>
          </div>

          {!isFavorites && (
            <div
              className={styles.catalogHeroMark}
              aria-hidden="true"
            >
              <span>AM</span>
              <div>
                <strong>Armenia</strong>
                <small>Rentora</small>
              </div>
            </div>
          )}
        </section>

        {!isFavorites && (
          <section className={styles.catalogSearchWrapper}>
            <div className={styles.catalogSearchIntro}>
              <h2>Search properties</h2>

              <Link
                href="/map"
                className={styles.catalogInlineMapLink}
              >
                <Map size={16} />
                Map
              </Link>
            </div>

            <SearchForm
              compact
              submitPath="/properties"
            />

            <nav
              className={styles.catalogQuickLinks}
              aria-label="Popular cities"
            >
              <Link href="/properties?city=YEREVAN">
                {cityOf("YEREVAN")}
              </Link>

              <Link href="/properties?city=GYUMRI">
                {cityOf("GYUMRI")}
              </Link>

              <Link href="/properties?city=DILIJAN">
                {cityOf("DILIJAN")}
              </Link>

              <Link href="/properties?city=SEVAN">
                {cityOf("SEVAN")}
              </Link>
            </nav>
          </section>
        )}

        {showFeatured && (
          <section
            className={styles.featuredSection}
            aria-labelledby="featured-homes-title"
          >
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeadingCopy}>
                <p className={styles.featuredEyebrow}>
                  <Sparkles size={14} />
                  Promoted
                </p>

                <h2
                  id="featured-homes-title"
                  className={styles.featuredTitle}
                >
                  Featured homes
                </h2>
              </div>

              <span className={styles.featuredCount}>
                <Sparkles size={14} />
                {featuredItems.length}
              </span>
            </div>

            <div
              className={`${styles.propertyGrid} ${styles.featuredGrid}`}
            >
              {featuredItems.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.resultsSection}>
          <header className={styles.resultsHeader}>
            <div className={styles.resultsTitleRow}>
              <h2>
                {isFavorites
                  ? "Saved homes"
                  : showFeatured
                    ? "More homes"
                    : "Available homes"}
              </h2>

              {!loading && (
                <span className={styles.resultsCount}>
                  {displayedCount}
                </span>
              )}
            </div>

            <div className={styles.resultsActions}>
              {!isFavorites && query && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={styles.resetButton}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              )}

              <Link href="/map" className={styles.mapButton}>
                <Map size={16} />
                Map
              </Link>
            </div>
          </header>

          {chips.length > 0 && (
            <div className={styles.activeFilters}>
              {chips.map((chip) => (
                <button
                  type="button"
                  key={`${chip.key}-${chip.value}`}
                  onClick={() => removeFilter(chip.key)}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <X size={13} />
                </button>
              ))}
            </div>
          )}

          {error && (
            <div
              className={styles.catalogError}
              role="alert"
            >
              <Search size={22} />

              <div>
                <strong>{error}</strong>
                <button type="button" onClick={load}>
                  {t("common.tryAgain")}
                </button>
              </div>
            </div>
          )}

          {!error &&
            (loading || catalogItems.length > 0) && (
              <div className={styles.propertyGrid}>
                {loading
                  ? [1, 2, 3, 4, 5, 6].map((item) => (
                      <PropertySkeleton key={item} />
                    ))
                  : catalogItems.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onFavorite={
                          isFavorites ? load : undefined
                        }
                      />
                    ))}
              </div>
            )}

          {!loading && !error && items.length === 0 && (
            <div className={styles.catalogEmpty}>
              <span className={styles.emptyIcon}>
                <Search size={24} />
              </span>

              <h3>
                {isFavorites
                  ? "No saved homes yet"
                  : "No homes found"}
              </h3>

              <p>
                {isFavorites
                  ? "Save properties you like to find them here."
                  : "Try another city or remove some filters."}
              </p>

              {!isFavorites && query && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Reset filters
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            items.length > 0 &&
            catalogItems.length === 0 &&
            showFeatured && (
              <div className={styles.featuredOnlyNote}>
                <Sparkles size={17} />
                All available homes are shown above.
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
): string {
  switch (key) {
    case "city":
      return cityOf(value);

    case "category":
      return (
        categoryLabels[
          value as keyof typeof categoryLabels
        ] || value
      );

    case "listing":
      return getListingLabel(value as never);

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

    case "minArea":
      return `Area from ${value} m²`;

    case "maxArea":
      return `Area up to ${value} m²`;

    case "floor":
      return `Floor ${value}`;

    case "minFloor":
      return `Floor from ${value}`;

    case "maxFloor":
      return `Floor up to ${value}`;

    case "constructionYear":
      return value;

    case "minConstructionYear":
      return `Built from ${value}`;

    case "maxConstructionYear":
      return `Built before ${value}`;

    case "currency":
      return value.toUpperCase();

    case "features":
      return value.replaceAll("_", " ").toLowerCase();

    default:
      return value;
  }
}