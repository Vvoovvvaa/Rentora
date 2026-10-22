"use client";

import Link from "next/link";
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
      <main className={styles.catalogPage}>
        <div className={`shell ${styles.loginRequired}`}>
          <UserRound size={34} />

          <h1>{t("auth.welcomeBack")}</h1>

          <p>{t("auth.signInCopy")}</p>

          <Link
            href="/login"
            className={styles.loginButton}
          >
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

  const title =
    kind === "favorites"
      ? "Saved homes"
      : "Explore homes";

  const subtitle =
    kind === "favorites"
      ? "Keep the homes you like close at hand and come back when you're ready."
      : "Discover homes across Armenia, compare your options, and find a place that feels right.";

  const eyebrow =
    kind === "favorites"
      ? "Favorites"
      : "Properties";

  // Load properties from the existing API.
  const load = useCallback(() => {
    setLoading(true);
    setError("");

    let request: Promise<Property[]>;

    if (kind === "favorites") {
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
          (data as Record<string, number>)[key] =
            Number(value);
        } else {
          (data as Record<string, string>)[key] =
            value;
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
  }, [kind, query]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  // Boosted properties have priority.
  // Preserve the existing API order inside each group.
  const sortedItems = useMemo(() => {
    if (kind !== "properties") {
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
  }, [items, kind]);

  // The featured section appears only in the unfiltered public catalogue.
  // Filtered results continue to use the normal search page.
  const canShowFeatured =
    kind === "properties" && query.length === 0;

  const allBoostedItems = useMemo(
    () =>
      sortedItems.filter((property) =>
        Boolean(property.boops),
      ),
    [sortedItems],
  );

  // Limit the featured shelf to three cards.
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

  // Remove only the cards already shown in the featured shelf.
  // Additional boosted listings remain in the normal grid.
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

  // Active filter chips.
  const chips = useMemo(() => {
    if (kind !== "properties") {
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
  }, [kind, query]);

  const removeFilter = (key: string) => {
    const next = new URLSearchParams(query);

    next.delete(key);

    router.replace(
      `/properties${
        next.size
          ? `?${next.toString()}`
          : ""
      }`,
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
        {/* ==============================
            CATALOG HERO
        ============================== */}

        <section className={styles.catalogHero}>
          <div
            className={styles.catalogHeroGlow}
            aria-hidden="true"
          />

          <div className={styles.catalogHeroCopy}>
            <p className={styles.catalogEyebrow}>
              {eyebrow}
            </p>

            <h1>{title}</h1>

            <p className={styles.catalogHeroSubtitle}>
              {subtitle}
            </p>

            {kind === "properties" && (
              <div className={styles.catalogHeroPills}>
                <span>
                  <Sparkles size={14} />
                  Smart discovery
                </span>

                <span>
                  <Map size={14} />
                  Explore on the map
                </span>

                <span>
                  <MessageSquareMore size={14} />
                  Contact owners directly
                </span>

                <span>
                  <ShieldCheck size={14} />
                  Browse with confidence
                </span>
              </div>
            )}
          </div>

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
        </section>

        {/* ==============================
            SEARCH
        ============================== */}

        {kind === "properties" && (
          <section
            className={styles.catalogSearchWrapper}
          >
            <div className={styles.catalogSearchIntro}>
              <div>
                <p>Find your next place</p>

                <h3>
                  Start broad, then narrow down by
                  city, budget, and home type.
                </h3>
              </div>

              <Link
                href="/map"
                className={styles.catalogInlineMapLink}
              >
                <Map size={16} />
                Browse on map
              </Link>
            </div>

            <SearchForm
              compact
              submitPath="/properties"
            />

            <div className={styles.catalogQuickLinks}>
              <span>Popular:</span>

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
            </div>
          </section>
        )}

        {/* ==============================
            FEATURED / BOOSTED HOMES
        ============================== */}

        {showFeatured && (
          <section
            className={styles.featuredSection}
            aria-labelledby="featured-homes-title"
          >
            <div className={styles.featuredHeader}>
              <div
                className={styles.featuredHeadingCopy}
              >
                <p className={styles.featuredEyebrow}>
                  <Sparkles size={14} />
                  Promoted on Rentora
                </p>

                <h2
                  id="featured-homes-title"
                  className={styles.featuredTitle}
                >
                  Featured homes
                </h2>

                <p className={styles.featuredCopy}>
                  Homes owners have boosted to make
                  them easier to discover.
                </p>
              </div>

              <span className={styles.featuredCount}>
                <Sparkles size={14} />

                {featuredItems.length} promoted{" "}
                {featuredItems.length === 1
                  ? "home"
                  : "homes"}
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

            {allBoostedItems.length >
              featuredItems.length && (
              <p className={styles.featuredFootnote}>
                More promoted listings appear first
                in the catalogue below.
              </p>
            )}
          </section>
        )}

        {/* ==============================
            REGULAR CATALOGUE
        ============================== */}

        <section className={styles.resultsSection}>
          <header className={styles.resultsHeader}>
            <div>
              <p className={styles.resultsEyebrow}>
                {kind === "favorites"
                  ? "Your collection"
                  : showFeatured
                    ? "Discover more"
                    : "Property listings"}
              </p>

              <div className={styles.resultsTitleRow}>
                <h2>
                  {kind === "favorites"
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

              <p className={styles.resultsHelper}>
                {kind === "favorites"
                  ? "Your saved homes stay here so you can return to them quickly."
                  : showFeatured
                    ? "Explore the rest of the catalogue. Promoted listings are highlighted above."
                    : "Compare prices, locations, and features to find the right property."}
              </p>
            </div>

            <div className={styles.resultsActions}>
              {kind === "properties" && query && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={styles.resetButton}
                >
                  <RotateCcw size={15} />
                  Reset filters
                </button>
              )}

              <Link
                href="/map"
                className={styles.mapButton}
              >
                <Map size={16} />
                Search on the map
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

                <button
                  type="button"
                  onClick={load}
                >
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
                          kind === "favorites"
                            ? load
                            : undefined
                        }
                      />
                    ))}
              </div>
            )}

          {!loading &&
            !error &&
            items.length === 0 && (
              <div className={styles.catalogEmpty}>
                <span>
                  <Search size={24} />
                </span>

                <h3>
                  {kind === "favorites"
                    ? "No saved homes yet"
                    : "No homes matched your filters"}
                </h3>

                <p>
                  Try fewer filters, a different
                  city, or reset the search to see
                  more properties.
                </p>

                {kind === "properties" && query && (
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
                All available listings are featured
                above.
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